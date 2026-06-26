export type EntryMethod = "manual" | "pending_order";

export type V10Permission =
  | "TRADE_ALLOWED"
  | "PENDING_ORDER_SIGNAL"
  | "CAUTION_SIGNAL"
  | "AVOID_TRADE";

export type V10Layer =
  | "LIVE"
  | "PENDING_ORDER_ELIGIBLE"
  | "PRACTICE"
  | "RADAR"
  | "REJECTED";

export type V10TimingStatus =
  | "PREPARE SIGNAL"
  | "ENTRY WINDOW OPEN"
  | "LIVE TRADE PERMISSION"
  | "CAUTION WINDOW"
  | "SIGNAL EXPIRED"
  | "WAIT NEXT CANDLE"
  | "SETUP FORMING"
  | "PENDING ORDER ELIGIBLE"
  | "PENDING ORDER CAUTION"
  | "FINAL VALIDATION REQUIRED"
  | "CANCEL PENDING ORDER"
  | "ENTRY TIME REACHED"
  | "ORDER EXPIRED"
  | "BLOCKED";

export type V10StrategyType =
  | "TREND_PULLBACK"
  | "MOMENTUM_BREAKOUT"
  | "RANGE_REVERSAL"
  | "EXHAUSTION_RISK"
  | "UNKNOWN";

export interface HtfBiasResult {
  ok: boolean;
  status: string;
  ema9: number;
  ema21: number;
  slope: number;
}

export interface ApplyV10Options {
  entryMethod: EntryMethod;
  htfCandlesByPair: Map<string, import("../types").OHLC[]>;
  now?: Date;
  sessionFilter?: string;
  allowEurGbp5Min?: boolean;
}
