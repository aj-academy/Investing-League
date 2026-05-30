import type { ComputedSignal } from "@/lib/signal-engine/types";

export type DemoJournalRow = {
  id: string;
  user_id: string;
  pair: string;
  timeframe: string;
  direction: "CALL" | "PUT";
  grade: string;
  confidence: number;
  score: number;
  signal_type: string;
  signal_reason: string;
  trade_eligible: boolean;
  signal_entry_time: string;
  signal_entry_price: number;
  olymp_open_time: string | null;
  olymp_opening_quote: number | null;
  olymp_closing_quote: number | null;
  olymp_trade_id: string | null;
  expiry_time: string;
  expiry_minutes: number;
  result: string;
  result_source: string;
  entry_drift: number | null;
  entry_status: string | null;
  loss_reason: string | null;
  marked_time: string | null;
  created_at: string;
  updated_at: string;
};

const journal: DemoJournalRow[] = [
  {
    id: "demo-j-1",
    user_id: "00000000-0000-4000-8000-000000000001",
    pair: "EUR/USD",
    timeframe: "5min",
    direction: "CALL",
    grade: "A+",
    confidence: 82,
    score: 8,
    signal_type: "STRONG FINAL",
    signal_reason: "Demo strong final setup for journal review.",
    trade_eligible: true,
    signal_entry_time: "10:15:00",
    signal_entry_price: 1.08452,
    olymp_open_time: "10:15:02",
    olymp_opening_quote: 1.08455,
    olymp_closing_quote: 1.08478,
    olymp_trade_id: "DEMO-1001",
    expiry_time: "10:20:00",
    expiry_minutes: 5,
    result: "Win",
    result_source: "Auto",
    entry_drift: 0.3,
    entry_status: "Valid Entry",
    loss_reason: null,
    marked_time: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-j-2",
    user_id: "00000000-0000-4000-8000-000000000001",
    pair: "GBP/USD",
    timeframe: "5min",
    direction: "PUT",
    grade: "A",
    confidence: 71,
    score: 7,
    signal_type: "FINAL TRADE",
    signal_reason: "Demo final trade for win-rate testing.",
    trade_eligible: true,
    signal_entry_time: "11:05:00",
    signal_entry_price: 1.2712,
    olymp_open_time: "11:05:01",
    olymp_opening_quote: 1.27125,
    olymp_closing_quote: 1.27125,
    olymp_trade_id: "DEMO-1002",
    expiry_time: "11:10:00",
    expiry_minutes: 5,
    result: "Refund",
    result_source: "Auto",
    entry_drift: 0.5,
    entry_status: "Valid Entry",
    loss_reason: null,
    marked_time: new Date().toISOString(),
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-j-3",
    user_id: "00000000-0000-4000-8000-000000000001",
    pair: "USD/JPY",
    timeframe: "15min",
    direction: "CALL",
    grade: "B",
    confidence: 58,
    score: 6,
    signal_type: "WATCH ONLY",
    signal_reason: "B-grade observation only — excluded from real win rate.",
    trade_eligible: false,
    signal_entry_time: "09:30:00",
    signal_entry_price: 149.852,
    olymp_open_time: null,
    olymp_opening_quote: null,
    olymp_closing_quote: null,
    olymp_trade_id: null,
    expiry_time: "09:45:00",
    expiry_minutes: 15,
    result: "Pending",
    result_source: "Unverified",
    entry_drift: null,
    entry_status: "Pending",
    loss_reason: null,
    marked_time: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let lastSignals: ComputedSignal[] = [];

export function getDemoJournal() {
  return journal;
}

export function updateDemoJournal(
  id: string,
  patch: Partial<DemoJournalRow>
): DemoJournalRow | null {
  const idx = journal.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  journal[idx] = {
    ...journal[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return journal[idx];
}

export function addDemoJournalFromSignals(signals: ComputedSignal[]) {
  lastSignals = signals;
  for (const sig of signals) {
    const exists = journal.some((j) => j.signal_entry_time === sig.entryTime && j.pair === sig.pair);
    if (exists) continue;
    journal.unshift({
      id: `demo-j-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: "00000000-0000-4000-8000-000000000001",
      pair: sig.pair,
      timeframe: sig.tf,
      direction: sig.direction,
      grade: sig.grade,
      confidence: sig.conf,
      score: sig.score,
      signal_type: sig.signalType,
      signal_reason: sig.signalReason,
      trade_eligible: sig.tradeEligible,
      signal_entry_time: sig.entryTime,
      signal_entry_price: parseFloat(sig.price),
      olymp_open_time: null,
      olymp_opening_quote: null,
      olymp_closing_quote: null,
      olymp_trade_id: null,
      expiry_time: sig.expTime,
      expiry_minutes: sig.expMin,
      result: "Pending",
      result_source: "Unverified",
      entry_drift: null,
      entry_status: "Pending",
      loss_reason: null,
      marked_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

export function getLastDemoSignals() {
  return lastSignals;
}
