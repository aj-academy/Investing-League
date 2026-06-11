import { requireApiAuth } from "@/lib/auth/apiAuth";
import { validatePairsForUser } from "@/lib/access/assetAccess";
import { getProfileByUserId } from "@/lib/auth/profile";
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
import {
  isInternalProviderError,
  sanitizeProviderError,
  sanitizeProviderErrors,
} from "@/lib/market/providerErrors";
import { buildTickerForPairs } from "@/lib/market/tickerService";
import { computeSignal, filterSignals, finalizeScanSignals, type V8JournalRow } from "@/lib/signal-engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { hasAcceptedLatestTerms } from "@/lib/terms/terms";
import { formatAppDateSlash, formatAppTime, resolveTimeZone } from "@/lib/datetime";
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
  let isAdmin = false;
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;
    isAdmin = auth!.isAdmin;

    const profile = await getProfileByUserId(auth!.user.id);
    const plan: PlanName = getUserPlan(profile);
    const planLimits = getPlanLimits(plan);

    const termsAccepted = await hasAcceptedLatestTerms(auth!.user.id);
    if (!termsAccepted) {
      return NextResponse.json(
        {
          ok: false,
          code: "TERMS_REQUIRED",
          error: "Please accept the latest Terms & Conditions before scanning.",
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
    const minGrade =
      body.minGrade === "A+" || body.minGrade === "A" || body.minGrade === "B"
        ? body.minGrade
        : undefined;
    const showBSignals = body.showBSignals !== false;
    const dailyTradeLimit = Number(body.dailyTradeLimit ?? 5);
    const sessionFilter = String(body.sessionFilter || "any");
    const timeZone = resolveTimeZone(body.timezone);

    try {
      const supabase = await createClient();
      pairs = await validatePairsForUser(auth!.user.id, plan, pairs, supabase);
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
      .select(
        "pair,timeframe,direction,signal_type,signal_entry_time,trade_eligible,result,created_at"
      )
      .eq("user_id", auth!.user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    const v8Journal: V8JournalRow[] = (journalRows || []).map((r) => {
      const created = r.created_at ? new Date(r.created_at) : new Date();
      const date = formatAppDateSlash(created, timeZone);
      const signalTime =
        r.signal_entry_time || formatAppTime(created, timeZone);
      const eligible =
        r.trade_eligible &&
        (r.signal_type === "FINAL TRADE" || r.signal_type === "STRONG FINAL");
      return {
        date,
        signalTime,
        type: r.signal_type || "WATCH ONLY",
        counted: eligible ? "YES" : "NO",
        pair: r.pair,
        direction: r.direction,
        result: r.result,
        entryTime: r.signal_entry_time,
      };
    });

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
          const sig = computeSignal(candleResult.candles, pair, tf, mode, [], {
            timeZone,
            minGrade,
          });
          if (sig) rawSignals.push(sig);
        } catch (e) {
          marketErrors.push(
            `${pair} ${tf}: ${e instanceof Error ? e.message : "no market data"}`
          );
        }
      }
    }

    const finalized = finalizeScanSignals(rawSignals, {
      mode,
      journal: v8Journal,
      dailyLimit: dailyTradeLimit,
      timeZone,
    });

    const filteredSignals = filterSignals(finalized, {
      pairs,
      timeframes,
      mode,
      minGrade,
      showBSignals,
      sessionFilter,
    });

    const toPersist =
      filteredSignals.length > 0
        ? filteredSignals
        : mode === "practice" && finalized.length > 0
          ? finalized
          : [];

    const toDisplay =
      filteredSignals.length > 0
        ? filteredSignals
        : finalized.length > 0
          ? finalized
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

    await writer.from("usage_logs").insert({
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
    const clientMarketErrors = sanitizeProviderErrors(marketErrors, isAdmin);

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
      marketErrors: clientMarketErrors,
      message:
        journalSaved > 0
          ? `Scan complete — ${journalSaved} signal(s) saved to your journal.`
          : signals.length > 0 && persistErrors.length > 0
            ? `Scan complete — ${signals.length} setup(s) on screen but save failed. Check Vercel SUPABASE_SERVICE_ROLE_KEY.`
            : clientMarketErrors.length > 0
              ? `Scan finished but no market data: ${clientMarketErrors[0]}`
              : rawSignals.length === 0
                ? "Scan complete — no setups found. Try another session filter or lower min grade."
                : "Scan complete — setups found but none matched your min grade filter.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scan failed";
    const status = isInternalProviderError(message) ? 429 : 500;
    const clientError = sanitizeProviderError(message, isAdmin);
    return NextResponse.json({ ok: false, error: clientError }, { status });
  }
}
