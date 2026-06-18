export type V9Layer = "LIVE" | "PRACTICE" | "RADAR" | "REJECTED";

export type ShowSignalsFilter = "all" | "live" | "practice_live";

export type V9ScanMeta = {
  headline: string;
  subline: string;
  status: "LIVE" | "PRACTICE" | "RADAR" | "DATA" | "EMPTY";
  liveCount: number;
  practiceCount: number;
  radarCount: number;
  rejectedCount: number;
  protectedRiskyCount: number;
  apiCalls: number;
  weekendBlocked: boolean;
  radarTop: V9RadarItem[];
  whyNoSignal: V9WhyItem[];
};

export type V9RadarItem = {
  pair: string;
  direction: string;
  tf: string;
  readiness: number;
  blocker: string;
  nextCondition: string;
  v9Layer: V9Layer;
  grade: string;
  conf: number;
};

export type V9WhyItem = {
  pair: string;
  direction: string;
  reason: string;
};
