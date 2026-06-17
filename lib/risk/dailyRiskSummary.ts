import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  cooldownActive,
  computeRecovery,
  deriveRiskStatus,
  num,
  todayDateString,
} from "./capitalProtection";
import { reconcileJournalCapitalForUser } from "./reconcileJournalCapital";
import type { CapitalProfileFields, DailyRiskSummary, RiskStatusPayload } from "./types";

type RiskClient = Awaited<ReturnType<typeof createClient>>;

function riskWriter() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
}

export async function checkCapitalColumnsReady(userId: string): Promise<boolean> {
  const client = riskWriter() ?? await createClient();
  const { error } = await client
    .from("profiles")
    .select("starting_capital")
    .eq("id", userId)
    .maybeSingle();
  if (!error) return true;
  return !/column|schema cache/i.test(error.message);
}

export async function getProfileCapitalFields(userId: string): Promise<CapitalProfileFields | null> {
  const defaults: CapitalProfileFields = {
    starting_capital: 0,
    current_capital: 0,
    risk_per_trade_percent: 5,
    daily_profit_target_percent: 10,
    daily_loss_limit_percent: 15,
    max_consecutive_losses: 3,
    trading_rules_accepted: false,
    login_rules_seen_at: null,
  };

  const admin = riskWriter();
  const client = admin ?? await createClient();
  const { data, error } = await client
    .from("profiles")
    .select(
      "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (/column|schema cache/i.test(error.message)) {
      return defaults;
    }
    return null;
  }

  if (!data) return defaults;

  return {
    starting_capital: num(data.starting_capital),
    current_capital: num(data.current_capital),
    risk_per_trade_percent: num(data.risk_per_trade_percent, 5),
    daily_profit_target_percent: num(data.daily_profit_target_percent, 10),
    daily_loss_limit_percent: num(data.daily_loss_limit_percent, 15),
    max_consecutive_losses: num(data.max_consecutive_losses, 3),
    trading_rules_accepted: Boolean(data.trading_rules_accepted),
    login_rules_seen_at: data.login_rules_seen_at ?? null,
  };
}

export async function getDailyRiskSummary(
  userId: string,
  tradeDate = todayDateString(),
): Promise<DailyRiskSummary | null> {
  const admin = riskWriter();
  const client = admin ?? await createClient();
  const { data, error } = await client
    .from("daily_risk_summary")
    .select("*")
    .eq("user_id", userId)
    .eq("trade_date", tradeDate)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeDailyRow(data);
}

function normalizeDailyRow(row: Record<string, unknown>): DailyRiskSummary {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    trade_date: String(row.trade_date),
    starting_capital: num(row.starting_capital),
    current_capital: num(row.current_capital),
    total_trades: num(row.total_trades),
    wins: num(row.wins),
    losses: num(row.losses),
    refunds: num(row.refunds),
    net_profit: num(row.net_profit),
    consecutive_losses: num(row.consecutive_losses),
    live_mode_locked: Boolean(row.live_mode_locked),
    cooldown_until: (row.cooldown_until as string | null) ?? null,
  };
}

export async function upsertDailyRiskSummary(
  userId: string,
  patch: Partial<DailyRiskSummary> & { trade_date?: string },
) {
  const writer = riskWriter();
  if (!writer) return { error: "Service role required for risk summary" };

  const tradeDate = patch.trade_date ?? todayDateString();
  const existing = await getDailyRiskSummary(userId, tradeDate);

  const row = {
    user_id: userId,
    trade_date: tradeDate,
    starting_capital: patch.starting_capital ?? existing?.starting_capital ?? 0,
    current_capital: patch.current_capital ?? existing?.current_capital ?? 0,
    total_trades: patch.total_trades ?? existing?.total_trades ?? 0,
    wins: patch.wins ?? existing?.wins ?? 0,
    losses: patch.losses ?? existing?.losses ?? 0,
    refunds: patch.refunds ?? existing?.refunds ?? 0,
    net_profit: patch.net_profit ?? existing?.net_profit ?? 0,
    consecutive_losses: patch.consecutive_losses ?? existing?.consecutive_losses ?? 0,
    live_mode_locked: patch.live_mode_locked ?? existing?.live_mode_locked ?? false,
    cooldown_until: patch.cooldown_until ?? existing?.cooldown_until ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await writer
    .from("daily_risk_summary")
    .upsert(row, { onConflict: "user_id,trade_date" })
    .select()
    .single();

  if (error) return { error: error.message, summary: null };
  return { error: null, summary: normalizeDailyRow(data) };
}

export function countConsecutiveLossesToday(
  rows: Array<{ result: string; marked_time?: string | null; updated_at?: string | null; created_at?: string }>,
): number {
  const settled = rows
    .filter((r) => r.result === "Win" || r.result === "Loss" || r.result === "Refund")
    .sort((a, b) => {
      const ta = new Date(a.marked_time || a.updated_at || a.created_at || 0).getTime();
      const tb = new Date(b.marked_time || b.updated_at || b.created_at || 0).getTime();
      return ta - tb;
    });

  let streak = 0;
  for (let i = settled.length - 1; i >= 0; i--) {
    if (settled[i].result === "Loss") streak++;
    else break;
  }
  return streak;
}

export async function aggregateTodayJournal(userId: string, tradeDate = todayDateString()) {
  const admin = riskWriter();
  const client = admin ?? await createClient();
  const start = `${tradeDate}T00:00:00.000Z`;
  const end = `${tradeDate}T23:59:59.999Z`;

  const { data } = await client
    .from("trade_journal")
    .select("result, net_profit, marked_time, updated_at, created_at")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lte("created_at", end);

  const rows = data || [];
  let wins = 0;
  let losses = 0;
  let refunds = 0;
  let netProfit = 0;
  let totalTrades = 0;

  for (const r of rows) {
    if (r.result === "Win") {
      wins++;
      totalTrades++;
      netProfit += num(r.net_profit);
    } else if (r.result === "Loss") {
      losses++;
      totalTrades++;
      netProfit += num(r.net_profit);
    } else if (r.result === "Refund") {
      refunds++;
      totalTrades++;
      netProfit += num(r.net_profit);
    }
  }

  const consecutiveLosses = countConsecutiveLossesToday(rows);

  return { wins, losses, refunds, netProfit, totalTrades, consecutiveLosses, rows };
}

export async function buildRiskStatusPayload(userId: string): Promise<RiskStatusPayload | null> {
  await reconcileJournalCapitalForUser(userId);

  const profile = await getProfileCapitalFields(userId);
  if (!profile) return null;

  const tradeDate = todayDateString();
  let daily = await getDailyRiskSummary(userId, tradeDate);
  const agg = await aggregateTodayJournal(userId, tradeDate);

  if (!daily) {
    const upsert = await upsertDailyRiskSummary(userId, {
      trade_date: tradeDate,
      starting_capital: profile.starting_capital,
      current_capital: profile.current_capital,
      wins: agg.wins,
      losses: agg.losses,
      refunds: agg.refunds,
      net_profit: agg.netProfit,
      total_trades: agg.totalTrades,
      consecutive_losses: agg.consecutiveLosses,
    });
    daily = upsert.summary ?? null;
  }

  const cooldownUntil = daily?.cooldown_until ?? null;
  const lockActive =
    Boolean(daily?.live_mode_locked) && cooldownActive(cooldownUntil);

  const consecutiveLosses = daily?.consecutive_losses ?? agg.consecutiveLosses;
  const todayNetProfit = agg.netProfit;

  const riskStatus = deriveRiskStatus(
    consecutiveLosses,
    profile.max_consecutive_losses,
    profile.daily_loss_limit_percent,
    profile.starting_capital,
    todayNetProfit,
  );

  return {
    riskStatus,
    daily,
    profile,
    liveModeLocked: lockActive,
    cooldownUntil,
    cooldownActive: lockActive,
    todayNetProfit,
    consecutiveLosses,
    recovery: computeRecovery(profile.starting_capital, profile.current_capital),
  };
}

export async function isLiveModeBlocked(userId: string): Promise<{
  blocked: boolean;
  cooldownUntil: string | null;
  message: string | null;
}> {
  const tradeDate = todayDateString();
  const daily = await getDailyRiskSummary(userId, tradeDate);
  if (!daily?.live_mode_locked) {
    return { blocked: false, cooldownUntil: null, message: null };
  }
  if (!cooldownActive(daily.cooldown_until)) {
    return { blocked: false, cooldownUntil: daily.cooldown_until, message: null };
  }
  return {
    blocked: true,
    cooldownUntil: daily.cooldown_until,
    message:
      "Live Mode paused for capital protection. You can continue Practice Mode or review your journal.",
  };
}

export async function refreshDailySummaryFromJournal(
  userId: string,
  profile: CapitalProfileFields,
  options?: { lockLive?: boolean; cooldownMinutes?: number },
) {
  const tradeDate = todayDateString();
  const agg = await aggregateTodayJournal(userId, tradeDate);
  const existing = await getDailyRiskSummary(userId, tradeDate);

  const maxLosses = profile.max_consecutive_losses;
  const shouldLock = options?.lockLive || agg.consecutiveLosses >= maxLosses;

  let cooldownUntil = existing?.cooldown_until ?? null;
  if (shouldLock) {
    const minutes = options?.cooldownMinutes ?? 30;
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    if (!cooldownUntil || new Date(cooldownUntil).getTime() < Date.now()) {
      cooldownUntil = until;
    }
  }

  return upsertDailyRiskSummary(userId, {
    trade_date: tradeDate,
    starting_capital: profile.starting_capital,
    current_capital: profile.current_capital,
    wins: agg.wins,
    losses: agg.losses,
    refunds: agg.refunds,
    net_profit: agg.netProfit,
    total_trades: agg.totalTrades,
    consecutive_losses: agg.consecutiveLosses,
    live_mode_locked: shouldLock || Boolean(existing?.live_mode_locked),
    cooldown_until: cooldownUntil,
  });
}
