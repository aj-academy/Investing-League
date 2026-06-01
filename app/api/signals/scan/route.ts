import { requireApiAuth } from "@/lib/auth/apiAuth";
import { hasAcceptedRiskDisclaimer, getProfileByUserId } from "@/lib/auth/profile";
import { canScanToday } from "@/lib/billing/scanUsage";
import {
  getLockedPairs,
  getPlanLimits,
  getUserPlan,
  resolveTimeframesForScan,
  validatePairsForPlan,
  type PlanName,
} from "@/lib/billing/planLimits";
import { getCandlesCached } from "@/lib/market/cachedCandles";
import { buildTickerForPairs } from "@/lib/market/tickerService";
import { computeSignal, filterSignals } from "@/lib/signal-engine";
import type { JournalHistoryRow } from "@/lib/signal-engine/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { resolveTimeZone } from "@/lib/datetime";
import { PAIRS } from "@/lib/utils";
import { NextResponse } from "next/server";

function signalRow(userId: string, scanSessionId: string, sig: ComputedSignal) {
  return {
    user_id: userId,
    scan_session_id: scanSessionId,
    signal_uid: sig.signalUid,
    pair: sig.pair,
    timeframe: sig.tf,
    expiry_minutes: sig.expMin,
    direction: sig.direction,
    grade: sig.grade,
    confidence: sig.conf,
    score: sig.score,
    score_gap: sig.scoreGap,
    weighted_score: sig.weightedScore,
    opposite_score: sig.oppositeScore,
    signal_type: sig.signalType,
    signal_reason: sig.signalReason,
    trade_eligible: sig.tradeEligible,
    mode: sig.mode,
    entry_time: sig.entryTime,
    entry_price: parseFloat(sig.price),
    expiry_time: sig.expTime,
    adx: sig.adx,
    atr: parseFloat(sig.atr) || null,
    rsi: parseFloat(sig.rsi) || null,
    stoch: parseFloat(sig.stoch) || null,
    cci: parseFloat(sig.cci) || null,
    bb: sig.bb,
    macd_hist: parseFloat(sig.macdH) || null,
    ema_wma_bias: sig.emaWmaBias,
    market_structure: sig.marketStructure.trend,
    candle_body_ratio: sig.candleBodyRatio,
    candle_strength: sig.candleStrengthText,
    live_rank: sig.liveRank || null,
    raw_payload: sig,
  };
}

function journalRow(userId: string, signalId: string | null, sig: ComputedSignal) {
  return {
    user_id: userId,
    signal_id: signalId,
    signal_uid: sig.signalUid,
    pair: sig.pair,
    timeframe: sig.tf,
    direction: sig.direction,
    grade: sig.grade,
    confidence: sig.conf,
    score: sig.score,
    signal_type: sig.signalType,
    signal_reason: sig.signalReason,
    trade_eligible: sig.tradeEligible,
    signal_entry_time: sig.entryTime,
    signal_entry_price: parseFloat(sig.price),
    expiry_time: sig.expTime,
    expiry_minutes: sig.expMin,
    result: "Pending",
    result_source: "Unverified",
    entry_status: "Pending",
  };
}

export async function POST(request: Request) {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const profile = await getProfileByUserId(auth!.user.id);
    const plan: PlanName = getUserPlan(profile);
    const planLimits = getPlanLimits(plan);

    const disclaimerOk = await hasAcceptedRiskDisclaimer(auth!.user.id);
    if (!disclaimerOk) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Risk disclaimer not saved yet. Open Settings, check the disclaimer box, click Save Settings, then scan again.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const isAuto = Boolean(body.auto);

    const scanQuota = await canScanToday(auth!.user.id, plan);
    if (!scanQuota.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "DAILY_SCAN_LIMIT",
          message: isAuto
            ? "Daily scan limit reached — auto refresh paused. Upgrade or try again tomorrow."
            : "You have reached your daily scan limit. Try again tomorrow or upgrade your plan.",
          scansUsedToday: scanQuota.scansUsedToday,
          dailyScanLimit: scanQuota.dailyScanLimit,
        },
        { status: 429 }
      );
    }
    let pairs: string[] = body.pairs?.length ? body.pairs : [...planLimits.allowedPairs];
    let timeframes: string[] = body.timeframes?.length ? body.timeframes : ["5min"];
    const mode = body.mode === "live" ? "live" : "practice";
    const minScore = Number(body.minScore ?? 5);
    const showBSignals = body.showBSignals !== false;
    const sessionFilter = String(body.sessionFilter || "any");
    const timeZone = resolveTimeZone(body.timezone);

    try {
      pairs = validatePairsForPlan(plan, pairs);
      timeframes = resolveTimeframesForScan(plan, timeframes);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Plan limit exceeded";
      return NextResponse.json(
        {
          ok: false,
          code: "PLAN_LIMIT",
          message,
          lockedPairs: getLockedPairs(plan),
          planLimits,
        },
        { status: 403 }
      );
    }

    for (const p of pairs) {
      if (!PAIRS.includes(p as (typeof PAIRS)[number])) {
        return NextResponse.json({ ok: false, error: `Invalid pair: ${p}` }, { status: 400 });
      }
    }

    const estimatedProviderCalls = pairs.length * timeframes.length;
    const supabase = await createClient();

    const { data: scanSession, error: sessionError } = await supabase
      .from("scan_sessions")
      .insert({
        user_id: auth!.user.id,
        mode,
        pairs,
        timeframes,
        min_score: minScore,
        show_b_signals: showBSignals,
        session_filter: sessionFilter,
        estimated_provider_calls: estimatedProviderCalls,
        plan_at_scan: plan,
        status: "running",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (sessionError || !scanSession) {
      return NextResponse.json(
        { ok: false, error: sessionError?.message || "Could not create scan session" },
        { status: 500 }
      );
    }

    const { data: journalRows } = await supabase
      .from("trade_journal")
      .select("pair,timeframe,direction,signal_type,signal_entry_time")
      .eq("user_id", auth!.user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    const history: JournalHistoryRow[] = (journalRows || []).map((r) => ({
      pair: r.pair,
      timeframe: r.timeframe,
      direction: r.direction as "CALL" | "PUT",
      signalType: r.signal_type || undefined,
      signal_entry_time: r.signal_entry_time || undefined,
    }));

    let providerCalls = 0;
    let cacheHits = 0;
    const rawSignals: ComputedSignal[] = [];
    const marketErrors: string[] = [];

    for (const pair of pairs) {
      for (const tf of timeframes) {
        try {
          const candleResult = await getCandlesCached(pair, tf, 150);
          if (candleResult.providerCall) providerCalls++;
          if (candleResult.cacheHit) cacheHits++;
          const sig = computeSignal(candleResult.candles, pair, tf, mode, history, {
            timeZone,
          });
          if (sig) rawSignals.push(sig);
        } catch (e) {
          marketErrors.push(
            `${pair} ${tf}: ${e instanceof Error ? e.message : "no market data"}`
          );
        }
      }
    }

    const filteredSignals = filterSignals(rawSignals, {
      pairs,
      timeframes,
      mode,
      minScore,
      showBSignals,
      sessionFilter,
    });

    const toPersist =
      filteredSignals.length > 0
        ? filteredSignals
        : mode === "practice" && rawSignals.length > 0
          ? rawSignals
          : [];

    const toDisplay =
      filteredSignals.length > 0
        ? filteredSignals
        : rawSignals.length > 0
          ? rawSignals
          : [];

    const admin = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : null;
    const writer = admin ?? supabase;
    const signalsToSave = toDisplay.length > 0 ? toDisplay : toPersist;
    let journalSaved = 0;
    let signalsSaved = 0;
    const persistErrors: string[] = [];

    if (!admin && signalsToSave.length > 0) {
      persistErrors.push(
        "Server missing SUPABASE_SERVICE_ROLE_KEY — scan results may not persist after you leave the page."
      );
    }

    for (const sig of signalsToSave) {
      const { data: savedSignal, error: sigErr } = await writer
        .from("signals")
        .upsert(signalRow(auth!.user.id, scanSession.id, sig), {
          onConflict: "user_id,signal_uid",
        })
        .select("id")
        .single();

      if (sigErr) {
        persistErrors.push(`${sig.pair}: ${sigErr.message}`);
        continue;
      }
      signalsSaved++;

      const { error: journalErr } = await writer.from("trade_journal").upsert(
        journalRow(auth!.user.id, savedSignal?.id || null, sig),
        { onConflict: "user_id,signal_uid" }
      );

      if (journalErr) {
        persistErrors.push(`journal ${sig.pair}: ${journalErr.message}`);
      } else {
        journalSaved++;
      }
    }

    const signals = toDisplay;

    await supabase
      .from("scan_sessions")
      .update({
        total_signals: filteredSignals.length || rawSignals.length,
        provider_calls: providerCalls,
        cache_hits: cacheHits,
        status: "completed",
      })
      .eq("id", scanSession.id);

    await supabase.from("usage_logs").insert({
      user_id: auth!.user.id,
      action: "scan_market",
      mode,
      request_count: estimatedProviderCalls,
      provider_calls: providerCalls,
      cache_hits: cacheHits,
      estimated_provider_calls: estimatedProviderCalls,
      metadata: {
        pairs,
        timeframes,
        signalCount: filteredSignals.length,
        rawSignalCount: rawSignals.length,
        journalSaved,
        signalsSaved,
        persistErrors,
        marketErrors,
        scanSessionId: scanSession.id,
        plan,
      },
    });

    const tickerResult = await buildTickerForPairs(pairs, plan);
    const scansUsedAfter = scanQuota.scansUsedToday + 1;

    return NextResponse.json({
      ok: true,
      auto: isAuto,
      scanSessionId: scanSession.id,
      signals,
      ticker: tickerResult.items,
      connected: !!process.env.TWELVE_DATA_API_KEY,
      usage: {
        plan,
        estimatedProviderCalls,
        providerCalls,
        cacheHits,
        dailyScanLimit: scanQuota.dailyScanLimit,
        scansUsedToday: scansUsedAfter,
        scansRemainingToday: Math.max(0, scanQuota.dailyScanLimit - scansUsedAfter),
      },
      planLimits,
      lockedPairs: getLockedPairs(plan),
      rawSignalCount: rawSignals.length,
      filteredSignalCount: filteredSignals.length,
      journalSaved,
      signalsSaved,
      persistErrors,
      marketErrors,
      message:
        journalSaved > 0
          ? `Scan complete — ${journalSaved} signal(s) saved to your journal.`
          : signals.length > 0 && persistErrors.length > 0
            ? `Scan complete — ${signals.length} setup(s) on screen but save failed. Check Vercel SUPABASE_SERVICE_ROLE_KEY.`
            : marketErrors.length > 0
              ? `Scan finished but no market data: ${marketErrors[0]}`
              : rawSignals.length === 0
                ? "Scan complete — no setups found. Try another session filter or lower min score."
                : "Scan complete — setups found but none matched your filters. Lower min score or enable B signals.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scan failed";
    const status = /api limit|api credits/i.test(message) ? 429 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
