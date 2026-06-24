export const CAPITAL_PROFILE_COLUMNS_FULL =
  "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, weekly_profit_target_amount, weekly_target_from, weekly_target_to, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at";

/** Before weekly target column existed. */
export const CAPITAL_PROFILE_COLUMNS_LEGACY =
  "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at";

/** Old column name (daily_profit_target_amount) — same data, pre-rename. */
export const CAPITAL_PROFILE_COLUMNS_LEGACY_DAILY_AMOUNT =
  "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_profit_target_amount, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at";

/** Weekly amount without custom week dates. */
export const CAPITAL_PROFILE_COLUMNS_LEGACY_WEEKLY_AMOUNT =
  "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, weekly_profit_target_amount, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at";

export function isSchemaColumnError(message: string) {
  return /column|schema cache/i.test(message);
}

export function omitWeeklyTargetExtras<T extends Record<string, unknown>>(patch: T) {
  const {
    weekly_profit_target_amount: _w,
    daily_profit_target_amount: _d,
    weekly_target_from: _f,
    weekly_target_to: _t,
    ...rest
  } = patch;
  return rest;
}

export function weeklyAmountFromRow(row: Record<string, unknown>): number {
  const weekly = Number(row.weekly_profit_target_amount);
  if (Number.isFinite(weekly) && weekly > 0) return weekly;
  const legacyDaily = Number(row.daily_profit_target_amount);
  if (Number.isFinite(legacyDaily) && legacyDaily > 0) return legacyDaily;
  return 0;
}
