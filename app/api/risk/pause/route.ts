import { requireApiAuth } from "@/lib/auth/apiAuth";
import { requireAdminApi } from "@/lib/admin/guard";
import { DEFAULT_COOLDOWN_MINUTES } from "@/lib/risk/capitalProtection";
import {
  buildRiskStatusPayload,
  getDailyRiskSummary,
  upsertDailyRiskSummary,
} from "@/lib/risk/dailyRiskSummary";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayDateString } from "@/lib/risk/capitalProtection";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "pause");

  if (action === "admin_clear_lock") {
    const { error: adminError } = await requireAdminApi();
    if (adminError) return adminError;

    const targetUserId = String(body.userId || "");
    if (!targetUserId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const tradeDate = String(body.tradeDate || todayDateString());
    const result = await upsertDailyRiskSummary(targetUserId, {
      trade_date: tradeDate,
      live_mode_locked: false,
      cooldown_until: null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

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

  const payload = await buildRiskStatusPayload(auth!.user.id);
  return NextResponse.json({ ok: true, ...payload, summary: result.summary });
}
