import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getProfileByUserId } from "@/lib/auth/profile";
import { getPlanLimits, getUserPlan } from "@/lib/billing/planLimits";
import { NextResponse } from "next/server";

/** Lightweight status for header — does not call the market data API. */
export async function GET() {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const profile = await getProfileByUserId(auth!.user.id);
    const plan = getUserPlan(profile);
    const limits = getPlanLimits(plan);
    const configured = Boolean(process.env.TWELVE_DATA_API_KEY);

    return NextResponse.json({
      ok: true,
      configured,
      liveUpdateMode: limits.liveUpdateMode,
      canPollLive: limits.liveUpdateMode !== "cached_only" && configured,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Status unavailable";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
