import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getProfileByUserId } from "@/lib/auth/profile";
import { getUserPlan } from "@/lib/billing/planLimits";
import { sanitizeProviderError } from "@/lib/market/providerErrors";
import { buildTickerForPairs, readLatestScanTicker } from "@/lib/market/tickerService";
import { loadLatestScanForUser } from "@/lib/signals/loadLatestScan";
import { NextResponse } from "next/server";

export async function GET() {
  let isAdmin = false;
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;
    isAdmin = auth!.isAdmin;

    const latest = await loadLatestScanForUser(auth!.user.id);

    if (!latest.signals.length) {
      return NextResponse.json({
        ok: true,
        hasLatest: false,
        message: latest.sessionId
          ? "Scan session found but no signals stored yet. Run SCAN MARKET again."
          : "No recent scan session. Click SCAN MARKET to generate a fresh decision.",
      });
    }

    const profile = await getProfileByUserId(auth!.user.id);
    const plan = getUserPlan(profile);
    const scanTicker = latest.sessionId
      ? await readLatestScanTicker(auth!.user.id, latest.sessionId)
      : {};
    const tickerResult = await buildTickerForPairs(
      latest.pairs.length ? latest.pairs : [...new Set(latest.signals.map((s) => s.pair))],
      plan,
      { fromLatestScan: scanTicker }
    );

    return NextResponse.json({
      ok: true,
      hasLatest: true,
      scanSessionId: latest.sessionId,
      signals: latest.signals,
      ticker: tickerResult.items,
      message:
        "Showing your latest scan result. Click SCAN MARKET to generate a fresh decision.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load latest scan";
    return NextResponse.json(
      { ok: false, error: sanitizeProviderError(message, isAdmin) },
      { status: 500 }
    );
  }
}
