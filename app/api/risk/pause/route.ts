import { requireApiAuth } from "@/lib/auth/apiAuth";
import { requireAdminApi } from "@/lib/admin/guard";
import { clientIp, writeAuditLog } from "@/lib/audit/writeAuditLog";
import { DEFAULT_COOLDOWN_MINUTES } from "@/lib/risk/capitalProtection";
import {
  buildRiskStatusPayload,
  getDailyRiskSummary,
  upsertDailyRiskSummary,
} from "@/lib/risk/dailyRiskSummary";
import { todayDateString } from "@/lib/risk/capitalProtection";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "pause");

  if (action === "admin_clear_lock" || action === "admin_activate_live") {
    const { auth, error: adminError } = await requireAdminApi();
    if (adminError) return adminError;

    const targetUserId = String(body.userId || "");
    if (!targetUserId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const tradeDate = String(body.tradeDate || todayDateString());
    const existing = await getDailyRiskSummary(targetUserId, tradeDate);
    const result = await upsertDailyRiskSummary(targetUserId, {
      trade_date: tradeDate,
      live_mode_locked: false,
      cooldown_until: null,
      consecutive_losses: 0,
      starting_capital: existing?.starting_capital,
      current_capital: existing?.current_capital,
      wins: existing?.wins,
      losses: existing?.losses,
      refunds: existing?.refunds,
      net_profit: existing?.net_profit,
      total_trades: existing?.total_trades,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await writeAuditLog({
      userId: auth!.user.id,
      action: "admin_activate_live",
      entityType: "profiles",
      entityId: targetUserId,
      metadata: { tradeDate, cleared: true },
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, summary: result.summary });
  }

  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const tradeDate = todayDateString();
  const daily = await getDailyRiskSummary(auth!.user.id, tradeDate);
  const minutes = Number(body.minutes) || DEFAULT_COOLDOWN_MINUTES;
  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  const result = await upsertDailyRiskSummary(auth!.user.id, {
    trade_date: tradeDate,
    live_mode_locked: true,
    cooldown_until: until,
    starting_capital: daily?.starting_capital,
    current_capital: daily?.current_capital,
    wins: daily?.wins,
    losses: daily?.losses,
    refunds: daily?.refunds,
    net_profit: daily?.net_profit,
    total_trades: daily?.total_trades,
    consecutive_losses: daily?.consecutive_losses,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAuditLog({
    userId: auth!.user.id,
    action: "user_pause_live",
    entityType: "daily_risk_summary",
    entityId: auth!.user.id,
    metadata: { minutes, until },
    ipAddress: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  const payload = await buildRiskStatusPayload(auth!.user.id);
  return NextResponse.json({ ok: true, ...payload, summary: result.summary });
}
