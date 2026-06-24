import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeDateInput, num, resolveWeeklyTargetRange } from "./capitalProtection";
import {
  CAPITAL_PROFILE_COLUMNS_FULL,
  CAPITAL_PROFILE_COLUMNS_LEGACY,
  CAPITAL_PROFILE_COLUMNS_LEGACY_DAILY_AMOUNT,
  CAPITAL_PROFILE_COLUMNS_LEGACY_WEEKLY_AMOUNT,
  isSchemaColumnError,
  omitWeeklyTargetExtras,
  weeklyAmountFromRow,
} from "./capitalProfileColumns";
import type { CapitalProfileFields } from "./types";

function profileFromRow(row: Record<string, unknown>): CapitalProfileFields {
  return {
    starting_capital: num(row.starting_capital),
    current_capital: num(row.current_capital),
    risk_per_trade_percent: num(row.risk_per_trade_percent, 5),
    daily_profit_target_percent: num(row.daily_profit_target_percent, 10),
    weekly_profit_target_amount: weeklyAmountFromRow(row),
    weekly_target_from: normalizeDateInput(row.weekly_target_from) || null,
    weekly_target_to: normalizeDateInput(row.weekly_target_to) || null,
    daily_loss_limit_percent: num(row.daily_loss_limit_percent, 15),
    max_consecutive_losses: num(row.max_consecutive_losses, 3),
    trading_rules_accepted: Boolean(row.trading_rules_accepted),
    login_rules_seen_at: (row.login_rules_seen_at as string | null) ?? null,
  };
}

export type PersistCapitalProfileResult = {
  profile: CapitalProfileFields | null;
  error: string | null;
  weeklyTargetExtrasSaved: boolean;
};

async function writeProfile(
  userId: string,
  email: string,
  patch: Record<string, unknown>,
  selectColumns: string,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .upsert({ id: userId, email, ...patch }, { onConflict: "id" })
      .select(selectColumns)
      .single();
    return { data: data as unknown as Record<string, unknown> | null, error: error?.message ?? null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select(selectColumns)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }
  if (!data) {
    return { data: null, error: "Profile row not found — contact support or re-login." };
  }
  return { data: data as unknown as Record<string, unknown>, error: null };
}

export async function persistCapitalProfile(
  userId: string,
  email: string,
  patch: Record<string, unknown>,
): Promise<PersistCapitalProfileResult> {
  let weeklyTargetExtrasSaved = true;

  let result = await writeProfile(userId, email, patch, CAPITAL_PROFILE_COLUMNS_FULL);
  if (result.error && isSchemaColumnError(result.error)) {
    const amountOnlyPatch = {
      ...omitWeeklyTargetExtras(patch),
      weekly_profit_target_amount: patch.weekly_profit_target_amount,
    };
    result = await writeProfile(
      userId,
      email,
      amountOnlyPatch,
      CAPITAL_PROFILE_COLUMNS_LEGACY_WEEKLY_AMOUNT,
    );
    if (!result.error) {
      weeklyTargetExtrasSaved = false;
    }
  }

  if (result.error && isSchemaColumnError(result.error)) {
    const legacyPatch = {
      ...omitWeeklyTargetExtras(patch),
      daily_profit_target_amount: patch.weekly_profit_target_amount,
    };
    result = await writeProfile(
      userId,
      email,
      legacyPatch,
      CAPITAL_PROFILE_COLUMNS_LEGACY_DAILY_AMOUNT,
    );
    weeklyTargetExtrasSaved = false;
  }

  if (result.error && isSchemaColumnError(result.error)) {
    weeklyTargetExtrasSaved = false;
    result = await writeProfile(
      userId,
      email,
      omitWeeklyTargetExtras(patch),
      CAPITAL_PROFILE_COLUMNS_LEGACY,
    );
  }

  if (result.error) {
    return { profile: null, error: result.error, weeklyTargetExtrasSaved: false };
  }

  return {
    profile: result.data ? profileFromRow(result.data) : null,
    error: null,
    weeklyTargetExtrasSaved,
  };
}
