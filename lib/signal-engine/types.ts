export type Direction = "CALL" | "PUT";
export type TradingMode = "practice" | "live";
export type SignalType =
  | "STRONG FINAL"
  | "FINAL TRADE"
  | "WATCH ONLY"
  | "REPEATED SIGNAL"
  | "TREND EXHAUSTED"
  | "LATE ENTRY"
  | "CORRELATION RISK"
  | "LIVE SELECTOR WATCH";

export type TradePermission = "TRADE ALLOWED" | "OBSERVE ONLY" | "DO NOT TRADE";

export interface OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Pattern {
  n: string;
  d: "bull" | "bear" | "neutral";
  s: number;
}

export interface CheckItem {
  name: string;
  pass: boolean;
  weight: number;
}

export interface MarketStructure {
  trend: "bullish" | "bearish" | "neutral";
  bullishBOS: boolean;
  bearishBOS: boolean;
  lastSwingHigh: number | null;
  lastSwingLow: number | null;
  structureScore: number;
  higherHigh?: boolean;
  higherLow?: boolean;
  lowerHigh?: boolean;
  lowerLow?: boolean;
}

export interface CategoryScores {
  trend: number;
  momentum: number;
  volatility: number;
  sr: number;
  candle: number;
}

export interface ComputedSignal {
  pair: string;
  direction: Direction;
  tf: string;
  score: number;
  conf: number;
  tier: string;
  grade: string;
  scoreGap: number;
  weightedScore: number;
  oppositeScore: number;
  category: CategoryScores;
  marketStructure: MarketStructure;
  emaWmaBias: string;
  emaBullTrend: boolean;
  emaBearTrend: boolean;
  wmaBullTrend: boolean;
  wmaBearTrend: boolean;
  emaBullCross: boolean;
  emaBearCross: boolean;
  wmaBullCross: boolean;
  wmaBearCross: boolean;
  trendMomentumBull: boolean;
  trendMomentumBear: boolean;
  overExtendedBull: boolean;
  overExtendedBear: boolean;
  bigCandle: boolean;
  price: string;
  chgPct: string;
  entryTime: string;
  expTime: string;
  entryAtIso?: string;
  expAtIso?: string;
  expMin: number;
  maxEntryDrift: string;
  entryNote: string;
  riskNote: string;
  rsi: string;
  stoch: string;
  cci: string;
  bb: string;
  macdH: string;
  atr: string;
  bullChecks: CheckItem[];
  bearChecks: CheckItem[];
  checks: CheckItem[];
  pats: Pattern[];
  pivs: { R2: number; R1: number; P: number; S1: number; S2: number };
  nearRes?: number;
  nearSup?: number;
  volOk: boolean;
  sidewaysMarket: boolean;
  emaCompression: number;
  reason: string;
  ohlc: OHLC[];
  signalUid: string;
  signalType: SignalType;
  signalReason: string;
  permission?: TradePermission;
  tradeEligible: boolean;
  mode: TradingMode;
  adx: number;
  candleBodyRatio: number;
  candleBullish: boolean;
  candleBearish: boolean;
  candleStrengthText: string;
  liveRank?: number;
}

export interface JournalHistoryRow {
  pair: string;
  timeframe: string;
  direction: Direction;
  signalType?: string;
  signal_entry_time?: string;
  entry_time?: string;
}
