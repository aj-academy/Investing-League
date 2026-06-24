export const CAPITAL_PROFILE_COLUMNS_FULL =
  "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_profit_target_amount, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at";

export const CAPITAL_PROFILE_COLUMNS_LEGACY =
  "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at";

export function isSchemaColumnError(message: string) {
  return /column|schema cache/i.test(message);
}

export function omitDailyProfitTargetAmount<T extends Record<string, unknown>>(patch: T): Omit<T, "daily_profit_target_amount"> {
  const { daily_profit_target_amount: _omit, ...rest } = patch;
  return rest;
}
