import { requireApiAuth } from "@/lib/auth/apiAuth";
import { computeSignal, filterSignals } from "@/lib/signal-engine";
import type { JournalHistoryRow } from "@/lib/signal-engine/types";
import { getCachedCandles, setCachedCandles } from "@/lib/market/candleCache";
import { fetchTwelveDataCandles } from "@/lib/market/twelveData";
import { createClient } from "@/lib/supabase/server";
import { PAIRS } from "@/lib/utils";
import { NextResponse } from "next/server";

async function getCandles(pair: string, interval: string) {
  let candles = getCachedCandles(pair, interval, 150);
  if (!candles) {
    candles = await fetchTwelveDataCandles(pair, interval, 150);
    setCachedCandles(pair, interval, 150, candles);
  }
  return candles;
}

export async function POST(request: Request) {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const pairs: string[] = body.pairs?.length ? body.pairs : [...PAIRS];
    const timeframes: string[] = body.timeframes?.length ? body.timeframes : ["5min"];
    const mode = body.mode === "live" ? "live" : "practice";
    const minScore = Number(body.minScore ?? 5);
    const showBSignals = body.showBSignals !== false;
    const sessionFilter = String(body.sessionFilter || "any");

    for (const p of pairs) {
      if (!PAIRS.includes(p as (typeof PAIRS)[number])) {
        return NextResponse.json({ error: `Invalid pair: ${p}` }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("risk_disclaimer_accepted")
      .eq("id", auth!.user.id)
      .single();

    if (!profile?.risk_disclaimer_accepted) {
      return NextResponse.json(
        { error: "Please accept the risk disclaimer in settings before scanning." },
        { status: 403 }
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

    const rawSignals = [];
    for (const pair of pairs) {
      for (const tf of timeframes) {
        const ohlc = await getCandles(pair, tf);
        const sig = computeSignal(ohlc, pair, tf, mode, history);
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
        { onConflict: "user_id,signal_uid", ignoreDuplicates: false }
      );
    }

    await supabase.from("usage_logs").insert({
      user_id: auth!.user.id,
      action: "scan",
      mode,
      request_count: pairs.length * timeframes.length,
      metadata: { pairs, timeframes, signalCount: signals.length },
    });

    return NextResponse.json({ signals, connected: !!process.env.TWELVE_DATA_API_KEY });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
