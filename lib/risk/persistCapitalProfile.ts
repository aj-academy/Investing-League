import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { num } from "./capitalProtection";
import {
  CAPITAL_PROFILE_COLUMNS_FULL,
  CAPITAL_PROFILE_COLUMNS_LEGACY,
  isSchemaColumnError,
  omitDailyProfitTargetAmount,
} from "./capitalProfileColumns";
import type { CapitalProfileFields } from "./types";

function profileFromRow(row: Record<string, unknown>): CapitalProfileFields {
  return {
    starting_capital: num(row.starting_capital),
    current_capital: num(row.current_capital),
    risk_per_trade_percent: num(row.risk_per_trade_percent, 5),
    daily_profit_target_percent: num(row.daily_profit_target_percent, 10),
    daily_profit_target_amount: num(row.daily_profit_target_amount),
    daily_loss_limit_percent: num(row.daily_loss_limit_percent, 15),
    max_consecutive_losses: num(row.max_consecutive_losses, 3),
    trading_rules_accepted: Boolean(row.trading_rules_accepted),
    login_rules_seen_at: (row.login_rules_seen_at as string | null) ?? null,
  };
}

export type PersistCapitalProfileResult = {
  profile: CapitalProfileFields | null;
  error: string | null;
  dailyTargetAmountSaved: boolean;
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
  let dailyTargetAmountSaved = true;

  let result = await writeProfile(userId, email, patch, CAPITAL_PROFILE_COLUMNS_FULL);
  if (result.error && isSchemaColumnError(result.error)) {
    dailyTargetAmountSaved = false;
    const legacyPatch = omitDailyProfitTargetAmount(patch);
    result = await writeProfile(userId, email, legacyPatch, CAPITAL_PROFILE_COLUMNS_LEGACY);
  }

  if (result.error) {
    return { profile: null, error: result.error, dailyTargetAmountSaved: false };
  }

  return {
    profile: result.data ? profileFromRow(result.data) : null,
    error: null,
    dailyTargetAmountSaved,
  };
}
