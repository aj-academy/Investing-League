export type TradeModeOption = "v9_live" | "micro_2m" | "both";

export type Micro2MPermission =
  | "2M_STRONG_MICRO"
  | "2M_MICRO_TRADE"
  | "2M_WATCH"
  | "2M_AVOID";

export type Micro2MLabel =
  | "STRONG 2M MICRO TRADE"
  | "2M MICRO TRADE"
  | "2M WATCH"
  | "2M AVOID";

export type OneMinuteConfirmation = "SUPPORTS" | "CONFLICTS" | "NEUTRAL" | "UNAVAILABLE";

export interface Micro2MSignal {
  id: string;
  pair: string;
  direction: "CALL" | "PUT";
  sourceTf: string;
  sourceLayer?: string | null;
  grade: string;
  conf: number;
  score: number;
  scoreGap: number;
  microReadiness: number;
  microPermission: Micro2MPermission;
  microLabel: Micro2MLabel;
  microReason: string;
  microAction: string;
  candleAligned: boolean;
  candleBodyRatio: number;
  isDoji: boolean;
  oneMinuteStatus: OneMinuteConfirmation;
  oneMinuteNote: string;
  expiryLabel: string;
  strategyType: "2M_MICRO";
  entryMethod: "manual_2m";
  isBest: boolean;
  warnings: string[];
  sourceSignalUid?: string;
}
