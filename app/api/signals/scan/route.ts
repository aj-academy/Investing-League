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
import { createClient } from "@/lib/supabase/server";
import { PAIRS } from "@/lib/utils";
import { NextResponse } from "next/server";

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

    const scanQuota = await canScanToday(auth!.user.id, plan);
    if (!scanQuota.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "DAILY_SCAN_LIMIT",
          message: "You have reached your daily scan limit. Try again tomorrow or upgrade your plan.",
          scansUsedToday: scanQuota.scansUsedToday,
          dailyScanLimit: scanQuota.dailyScanLimit,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    let pairs: string[] = body.pairs?.length ? body.pairs : [...planLimits.allowedPairs];
    let timeframes: string[] = body.timeframes?.length ? body.timeframes : ["5min"];
    const mode = body.mode === "live" ? "live" : "practice";
    const minScore = Number(body.minScore ?? 5);
    const showBSignals = body.showBSignals !== false;
    const sessionFilter = String(body.sessionFilter || "any");

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
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
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
    const rawSignals = [];

    for (const pair of pairs) {
      for (const tf of timeframes) {
        const candleResult = await getCandlesCached(pair, tf, 150);
        if (candleResult.providerCall) providerCalls++;
        if (candleResult.cacheHit) cacheHits++;
        const sig = computeSignal(candleResult.candles, pair, tf, mode, history);
        if (sig) rawSignals.push(sig);
      }
    }

    const signals = filterSignals(rawSignals, {
      pairs,
      timeframes,
      mode,
      minScore,
      showBSignals,
      sessionFilter,
    });

    for (const sig of signals) {
      const { data: savedSignal } = await supabase
        .from("signals")
        .upsert(
          {
            user_id: auth!.user.id,
            scan_session_id: scanSession.id,
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
          },
          { onConflict: "user_id,signal_uid" }
        )
        .select("id")
        .single();

      await supabase.from("trade_journal").upsert(
        {
          user_id: auth!.user.id,
          signal_id: savedSignal?.id || null,
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
        },
        { onConflict: "user_id,signal_uid", ignoreDuplicates: true }
      );
    }

    await supabase
      .from("scan_sessions")
      .update({
        total_signals: signals.length,
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
        signalCount: signals.length,
        scanSessionId: scanSession.id,
        plan,
      },
    });

    const tickerResult = await buildTickerForPairs(pairs, plan);
    const scansUsedAfter = scanQuota.scansUsedToday + 1;

    return NextResponse.json({
      ok: true,
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
      message: "Scan complete. Signals saved to your journal.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scan failed";
    const status = /api limit|api credits/i.test(message) ? 429 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
