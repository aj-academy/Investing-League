import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getProfileByUserId } from "@/lib/auth/profile";
import { getUserPlan } from "@/lib/billing/planLimits";
import { buildTickerForPairs, readLatestScanTicker } from "@/lib/market/tickerService";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: session } = await supabase
      .from("scan_sessions")
      .select("*")
      .eq("user_id", auth!.user.id)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({
        ok: true,
        hasLatest: false,
        message: "No recent scan session. Click SCAN MARKET to generate a fresh decision.",
      });
    }

    const { data: rows } = await supabase
      .from("signals")
      .select("raw_payload")
      .eq("user_id", auth!.user.id)
      .eq("scan_session_id", session.id);

    let signals = (rows || [])
      .map((r) => r.raw_payload as ComputedSignal | null)
      .filter(Boolean) as ComputedSignal[];

    if (!signals.length) {
      const { data: fallback } = await supabase
        .from("signals")
        .select("raw_payload")
        .eq("user_id", auth!.user.id)
        .order("created_at", { ascending: false })
        .limit(24);
      signals = (fallback || [])
        .map((r) => r.raw_payload as ComputedSignal | null)
        .filter(Boolean) as ComputedSignal[];
    }

    const profile = await getProfileByUserId(auth!.user.id);
    const plan = getUserPlan(profile);
    const scanTicker = await readLatestScanTicker(auth!.user.id, session.id);
    const tickerResult = await buildTickerForPairs(session.pairs as string[], plan, {
      fromLatestScan: scanTicker,
    });

    if (!signals.length) {
      return NextResponse.json({
        ok: true,
        hasLatest: false,
        message: "Scan session found but no signals stored yet. Run SCAN MARKET again.",
      });
    }

    return NextResponse.json({
      ok: true,
      hasLatest: true,
      scanSessionId: session.id,
      signals,
      ticker: tickerResult.items,
      scanMeta: {
        mode: session.mode,
        pairs: session.pairs,
        timeframes: session.timeframes,
        totalSignals: session.total_signals,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        planAtScan: session.plan_at_scan,
      },
      message:
        "Showing your latest scan result. Click SCAN MARKET to generate a fresh decision.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load latest scan";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
