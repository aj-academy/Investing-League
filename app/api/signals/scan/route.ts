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
import {
  applyV9Layers,
  applyV10Layers,
  buildV10ScanMeta,
  computeV9Signal,
  filterSignals,
  finalizeScanSignals,
  shouldJournalV10Signal,
  type ScanJournalRow,
} from "@/lib/signal-engine";
import type { EntryMethod } from "@/lib/signal-engine/v10/types";
import type { OHLC } from "@/lib/signal-engine/types";
import { PLATFORM_SAVE_FAILED } from "@/lib/platform/userCopy";
import { sanitizeUserFacingErrors } from "@/lib/platform/sanitizeUserFacingError";
import { upsertTradeJournalRow } from "@/lib/journal/upsertJournal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { hasAcceptedLatestTerms } from "@/lib/terms/terms";
import { isLiveModeBlocked } from "@/lib/risk/dailyRiskSummary";
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

    if (mode === "live") {
      const liveBlock = await isLiveModeBlocked(auth!.user.id);
      if (liveBlock.blocked) {
        return NextResponse.json(
          {
            ok: false,
            code: "LIVE_MODE_LOCKED",
            message: liveBlock.message,
            cooldownUntil: liveBlock.cooldownUntil,
          },
          { status: 403 },
        );
      }
    }

    const minScore = Number(body.minScore ?? 5);
    const minGrade =
      body.minGrade === "A+" || body.minGrade === "A" || body.minGrade === "B"
        ? body.minGrade
        : undefined;
    const showBSignals = body.showBSignals !== false;
    const dailyTradeLimit = Number(body.dailyTradeLimit ?? 5);
    const sessionFilter = String(body.sessionFilter || "any");
    const timeZone = resolveTimeZone(body.timezone);
    const entryMethod: EntryMethod =
      body.entryMethod === "manual" ? "manual" : "pending_order";
    const allowEurGbp5Min = process.env.ALLOW_EUR_GBP_5MIN_STRICT === "true";

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
        "pair,timeframe,direction,signal_type,signal_entry_time,trade_eligible,result,created_at,v9_layer"
      )
      .eq("user_id", auth!.user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    const scanJournal: ScanJournalRow[] = (journalRows || []).map((r) => {
      const created = r.created_at ? new Date(r.created_at) : new Date();
      const date = formatAppDateSlash(created, timeZone);
      const signalTime =
        r.signal_entry_time || formatAppTime(created, timeZone);
      const eligible =
        r.trade_eligible &&
        (r.signal_type === "FINAL TRADE" || r.signal_type === "STRONG FINAL");
      const v9Layer = (r as { v9_layer?: string | null }).v9_layer ?? null;
      return {
        date,
        signalTime,
        type: r.signal_type || "WATCH ONLY",
        counted: eligible && (v9Layer == null || v9Layer === "LIVE") ? "YES" : "NO",
        pair: r.pair,
        direction: r.direction,
        result: r.result,
        entryTime: r.signal_entry_time,
        v9Layer,
      };
    });

    let providerCalls = 0;
    let cacheHits = 0;
    const rawSignals: ComputedSignal[] = [];
    const marketErrors: string[] = [];
    const candlesByKey = new Map<string, OHLC[]>();

    for (const pair of pairs) {
      for (const tf of timeframes) {
        try {
          const candleResult = await getCandlesCached(pair, tf, 150);
          if (candleResult.providerCall) providerCalls++;
          if (candleResult.cacheHit) cacheHits++;
          candlesByKey.set(`${pair}:${tf}`, candleResult.candles);
          const sig = computeV9Signal(candleResult.candles, pair, tf, mode, timeZone);
          if (sig) rawSignals.push(sig);
        } catch (e) {
          marketErrors.push(
            `${pair} ${tf}: ${e instanceof Error ? e.message : "no market data"}`
          );
        }
      }
    }

    const htfCandlesByPair = new Map<string, OHLC[]>();
    const needsHtf = timeframes.includes("5min");
    if (needsHtf) {
      for (const pair of pairs) {
        const cached15 = candlesByKey.get(`${pair}:15min`);
        if (cached15?.length) {
          htfCandlesByPair.set(pair, cached15);
          continue;
        }
        try {
          const htfResult = await getCandlesCached(pair, "15min", 150);
          if (htfResult.providerCall) providerCalls++;
          if (htfResult.cacheHit) cacheHits++;
          htfCandlesByPair.set(pair, htfResult.candles);
        } catch {
          /* HTF optional — V10 will block 5min without bias */
        }
      }
    }

    const v9Layered = applyV9Layers(
      finalizeScanSignals(rawSignals, {
        mode,
        journal: scanJournal,
        dailyLimit: dailyTradeLimit,
        timeZone,
      }),
    );

    const finalized = applyV10Layers(v9Layered, {
      entryMethod,
      htfCandlesByPair,
      now: new Date(),
      sessionFilter,
      allowEurGbp5Min,
    });

    const filteredSignals = filterSignals(finalized, {
      pairs,
      timeframes,
      mode,
      minGrade,
      showBSignals,
      sessionFilter,
    });

    const v9Meta = buildV10ScanMeta(finalized, {
      apiCalls: providerCalls,
      marketErrors,
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
    const journalToSave = signalsToSave.filter(shouldJournalV10Signal);
    let journalSaved = 0;
    let signalsSaved = 0;
    const persistErrors: string[] = [];

    if (!admin && signalsToSave.length > 0) {
      persistErrors.push(
        "Scan results may not persist after you leave this page. Contact support if this continues.",
      );
    }

    for (const sig of signalsToSave) {
      let signalId: string | null = null;
      const { data: savedSignal, error: sigErr } = await writer
        .from("signals")
        .upsert(signalRow(auth!.user.id, scanSession.id, sig), {
          onConflict: "user_id,signal_uid",
        })
        .select("id")
        .single();

      if (sigErr) {
        persistErrors.push(`signal ${sig.pair}: ${sigErr.message}`);
      } else {
        signalsSaved++;
        signalId = savedSignal?.id || null;
      }

      if (!journalToSave.some((j) => j.signalUid === sig.signalUid)) {
        continue;
      }

      const journalResult = await upsertTradeJournalRow(
        writer,
        auth!.user.id,
        signalId,
        sig,
      );

      if (journalResult.error) {
        persistErrors.push(`journal ${sig.pair}: ${journalResult.error}`);
      } else {
        journalSaved++;
        if (journalResult.warning) {
          persistErrors.push(journalResult.warning);
        }
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
    const clientPersistErrors = sanitizeUserFacingErrors(persistErrors, PLATFORM_SAVE_FAILED);

    return NextResponse.json({
      ok: true,
      engine: "v10",
      entryMethod,
      auto: isAuto,
      scanSessionId: scanSession.id,
      signals,
      v9: v9Meta,
      allSignals: finalized,
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
      persistErrors: clientPersistErrors,
      marketErrors: clientMarketErrors,
      message:
        journalSaved > 0
          ? `Scan complete — ${journalSaved} signal(s) saved to your journal.`
          : signals.length > 0 && clientPersistErrors.length > 0
            ? `Scan complete — ${signals.length} setup(s) on screen but journal save failed: ${clientPersistErrors[0]}`
            : signals.length > 0 && journalToSave.length === 0
              ? `Scan complete — ${signals.length} setup(s) shown. Only Live and Practice layers are saved to journal (Radar/Rejected are not stored).`
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
