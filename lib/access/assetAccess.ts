import {
  ALL_PAIRS,
  getPlanLimits,
  type PairSymbol,
  type PlanName,
} from "@/lib/billing/planLimits";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserAssetRow = {
  pair: string;
  is_allowed: boolean;
};

export function getPlanAllowedPairs(plan: PlanName): string[] {
  return [...getPlanLimits(plan).allowedPairs];
}

export async function getUserAssetAccess(userId: string): Promise<UserAssetRow[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_asset_access")
    .select("pair,is_allowed")
    .eq("user_id", userId);
  return (data || []) as UserAssetRow[];
}

export async function resolveUserAllowedPairs(
  userId: string,
  plan: PlanName
): Promise<string[]> {
  const planPairs = getPlanAllowedPairs(plan);
  const customRows = await getUserAssetAccess(userId);
  if (!customRows.length) return planPairs;

  const enabled = new Set(
    customRows.filter((r) => r.is_allowed).map((r) => r.pair as PairSymbol)
  );
  const validPairs = ALL_PAIRS.filter((p) => enabled.has(p));
  return validPairs.length ? validPairs : [];
}

export async function validatePairsForUser(
  userId: string,
  plan: PlanName,
  selectedPairs: string[]
): Promise<string[]> {
  const allowed = new Set(await resolveUserAllowedPairs(userId, plan));
  const invalid = selectedPairs.filter((p) => !allowed.has(p));
  if (invalid.length) {
    throw new Error("This asset is not enabled for your account.");
  }
  return selectedPairs;
}
