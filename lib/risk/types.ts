export type RiskStatus = "normal" | "caution" | "stop";

export type CapitalProfileFields = {
  starting_capital: number;
  current_capital: number;
  risk_per_trade_percent: number;
  daily_profit_target_percent: number;
  weekly_profit_target_amount: number;
  daily_loss_limit_percent: number;
  max_consecutive_losses: number;
  trading_rules_accepted: boolean;
  login_rules_seen_at: string | null;
};

export type DailyRiskSummary = {
  id: string;
  user_id: string;
  trade_date: string;
  starting_capital: number;
  current_capital: number;
  total_trades: number;
  wins: number;
  losses: number;
  refunds: number;
  net_profit: number;
  consecutive_losses: number;
  live_mode_locked: boolean;
  cooldown_until: string | null;
};

export type RecoveryMetrics = {
  lossAmount: number;
  lossPercent: number;
  requiredRecoveryPercent: number;
  hasLoss: boolean;
  message: string | null;
};

export type RiskStatusPayload = {
  riskStatus: RiskStatus;
  daily: DailyRiskSummary | null;
  profile: CapitalProfileFields;
  liveModeLocked: boolean;
  cooldownUntil: string | null;
  cooldownActive: boolean;
  todayNetProfit: number;
  weekNetProfit: number;
  consecutiveLosses: number;
  recovery: RecoveryMetrics;
};
