import {
  ALL_PAIRS,
  getPlanLimits,
  type PairSymbol,
  type PlanName,
} from "@/lib/billing/planLimits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Stored when admin saves zero assets — user gets no pairs (not plan default). */
export const CUSTOM_ASSET_EMPTY_MARKER = "__CUSTOM_EMPTY__";

export type UserAssetRow = {
  pair: string;
  is_allowed: boolean;
};

export function isCustomAssetEmptyMarker(pair: string): boolean {
  return pair === CUSTOM_ASSET_EMPTY_MARKER;
}

export function getPlanAllowedPairs(plan: PlanName): string[] {
  return [...getPlanLimits(plan).allowedPairs];
}

type AssetAccessClient = SupabaseClient;

export async function getUserAssetAccess(
  userId: string,
  userClient?: AssetAccessClient
): Promise<UserAssetRow[]> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("user_asset_access")
      .select("pair,is_allowed")
      .eq("user_id", userId);
    return (data || []) as UserAssetRow[];
  }

  const supabase = userClient ?? (await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return [];

  const { data } = await supabase
    .from("user_asset_access")
    .select("pair,is_allowed")
    .eq("user_id", userId);
  return (data || []) as UserAssetRow[];
}

export async function resolveUserAllowedPairs(
  userId: string,
  plan: PlanName,
  userClient?: AssetAccessClient
): Promise<string[]> {
  const planPairs = getPlanAllowedPairs(plan);
  const customRows = await getUserAssetAccess(userId, userClient);
  if (!customRows.length) return planPairs;

  if (customRows.some((r) => isCustomAssetEmptyMarker(r.pair))) return [];

  const enabled = new Set(
    customRows
      .filter((r) => r.is_allowed && !isCustomAssetEmptyMarker(r.pair))
      .map((r) => r.pair as PairSymbol)
  );
  return ALL_PAIRS.filter((p) => enabled.has(p));
}

export async function validatePairsForUser(
  userId: string,
  plan: PlanName,
  selectedPairs: string[],
  userClient?: AssetAccessClient
): Promise<string[]> {
  const allowed = new Set(await resolveUserAllowedPairs(userId, plan, userClient));
  const invalid = selectedPairs.filter((p) => !allowed.has(p));
  if (invalid.length) {
    throw new Error("This asset is not enabled for your account.");
  }
  return selectedPairs;
}
