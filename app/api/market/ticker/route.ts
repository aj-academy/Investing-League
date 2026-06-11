import { requireApiAuth } from "@/lib/auth/apiAuth";
import { resolveUserAllowedPairs } from "@/lib/access/assetAccess";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/auth/profile";
import { getPlanLimits, getUserPlan, validatePairsForPlan } from "@/lib/billing/planLimits";
import {
  isInternalProviderError,
  sanitizeProviderError,
  USER_PROVIDER_ERROR,
} from "@/lib/market/providerErrors";
import { buildTickerForPairs } from "@/lib/market/tickerService";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return handleTicker(request);
}

export async function POST(request: Request) {
  return handleTicker(request);
}

async function handleTicker(request: Request) {
  let isAdmin = false;
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;
    isAdmin = auth!.isAdmin;

    const profile = await getProfileByUserId(auth!.user.id);
    const plan = getUserPlan(profile);
    const limits = getPlanLimits(plan);

    const supabase = await createClient();
    let pairs: string[] = await resolveUserAllowedPairs(auth!.user.id, plan, supabase);
    if (!pairs.length) pairs = [...limits.allowedPairs];
    try {
      const url = new URL(request.url);
      const q = url.searchParams.get("pairs");
      if (q) pairs = JSON.parse(q) as string[];
    } catch {
      /* default allowed pairs */
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        if (body.pairs?.length) pairs = body.pairs as string[];
      } catch {
        /* ignore */
      }
    }

    try {
      const allowed = await resolveUserAllowedPairs(auth!.user.id, plan, supabase);
      if (allowed.length) {
        pairs = pairs.filter((p) => allowed.includes(p));
      }
      pairs = validatePairsForPlan(plan, pairs);
    } catch {
      pairs = await resolveUserAllowedPairs(auth!.user.id, plan, supabase);
      if (!pairs.length) pairs = [...limits.allowedPairs];
    }

    const { items, providerCalls, cacheHits } = await buildTickerForPairs(pairs, plan);

    if (!items.length) {
      const cachedOnly = limits.liveUpdateMode === "cached_only";
      return NextResponse.json({
        ok: true,
        items: [],
        empty: true,
        message: cachedOnly
          ? "Cached prices appear after your first SCAN MARKET. Use SCAN MARKET to load setups."
          : isAdmin
            ? "No market data available. Check Twelve Data API key and daily credits."
            : USER_PROVIDER_ERROR,
        usage: { providerCalls: 0, cacheHits: 0, liveUpdateMode: limits.liveUpdateMode },
      });
    }

    return NextResponse.json({
      ok: true,
      items,
      empty: false,
      usage: {
        providerCalls,
        cacheHits,
        liveUpdateMode: limits.liveUpdateMode,
        quoteRefreshSeconds: limits.quoteRefreshSeconds,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Market data unavailable";
    const status = isInternalProviderError(message) ? 429 : 500;
    return NextResponse.json(
      { ok: false, error: sanitizeProviderError(message, isAdmin) },
      { status }
    );
  }
}
