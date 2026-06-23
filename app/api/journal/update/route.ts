import { requireApiAuth } from "@/lib/auth/apiAuth";
import { clientIp, writeAuditLog } from "@/lib/audit/writeAuditLog";
import { calculateEntryDrift } from "@/lib/journal/entryDrift";
import { fetchJournalRowForUser, saveJournalRowForUser } from "@/lib/journal/journalAccess";
import { calculateResult } from "@/lib/journal/resultCalculator";
import { isEligibleType } from "@/lib/journal/journalDisplay";
import { applyJournalCapitalUpdate } from "@/lib/risk/journalCapital";
import { getProfileCapitalFields, refreshDailySummaryFromJournal } from "@/lib/risk/dailyRiskSummary";
import { num } from "@/lib/risk/capitalProtection";
import { NextResponse } from "next/server";

function isSettledResult(result: string) {
  return result === "Win" || result === "Loss" || result === "Refund";
}

function shouldRefreshRiskSummary(
  prevResult: string,
  nextResult: string,
  body: Record<string, unknown>,
  lossLimitReached: boolean,
) {
  if (lossLimitReached) return true;
  if (body.result !== undefined && body.result !== null) return true;
  if (
    body.tradeAmount !== undefined ||
    body.payoutPercent !== undefined ||
    body.returnAmount !== undefined
  ) {
    return true;
  }
  if (isSettledResult(nextResult) && nextResult !== prevResult) return true;
  return false;
}

export async function PATCH(request: Request) {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const journalId = body.journalId as string;
    const signalUid = (body.signalUid as string | undefined) ?? null;
    if (!journalId) {
      return NextResponse.json({ error: "journalId required" }, { status: 400 });
    }

    const row = await fetchJournalRowForUser(auth!.user.id, journalId, signalUid);
    if (!row) {
      return NextResponse.json({ error: "Journal record not found" }, { status: 404 });
    }

    const opening =
      body.openingQuote !== undefined
        ? body.openingQuote === "" || body.openingQuote === null
          ? null
          : Number(body.openingQuote)
        : body.olympOpeningQuote !== undefined
          ? body.olympOpeningQuote === "" || body.olympOpeningQuote === null
            ? null
            : Number(body.olympOpeningQuote)
          : row.olymp_opening_quote;

    const closing =
      body.closingQuote !== undefined
        ? body.closingQuote === "" || body.closingQuote === null
          ? null
          : Number(body.closingQuote)
        : body.olympClosingQuote !== undefined
          ? body.olympClosingQuote === "" || body.olympClosingQuote === null
            ? null
            : Number(body.olympClosingQuote)
          : row.olymp_closing_quote;

    const openTime =
      body.openTime !== undefined
        ? body.openTime === "" || body.openTime === null
          ? null
          : String(body.openTime)
        : row.olymp_open_time;

    const { drift, status } = calculateEntryDrift(
      row.pair,
      row.signal_entry_price,
      opening,
    );

    const v9Layer = (row as { v9_layer?: string | null }).v9_layer ?? null;
    const eligibleForWr = isEligibleType(row.signal_type, row.grade, v9Layer);

    const prevResult = row.result as string;
    let result = prevResult;
    let resultSource = row.result_source as string;

    if (body.result !== undefined && body.result !== null) {
      result = String(body.result);
      resultSource = "Manual";
    } else if (opening !== null && closing !== null) {
      result = calculateResult(row.direction as "CALL" | "PUT", opening, closing);
      resultSource = "Auto";
      if (!eligibleForWr) {
        result = "Watch";
        resultSource = "Observation only";
      }
    } else if (opening === null || closing === null) {
      resultSource = "Unverified";
      if (!eligibleForWr && result === "Pending") {
        result = "Watch";
        resultSource = "Observation only";
      }
    }

    const tradeId =
      body.tradeId !== undefined
        ? body.tradeId === "" || body.tradeId === null
          ? null
          : String(body.tradeId)
        : row.olymp_trade_id;

    const tradeAmount =
      body.tradeAmount !== undefined
        ? body.tradeAmount === "" || body.tradeAmount === null
          ? null
          : num(body.tradeAmount)
        : undefined;

    const payoutPercent =
      body.payoutPercent !== undefined
        ? body.payoutPercent === "" || body.payoutPercent === null
          ? null
          : num(body.payoutPercent)
        : undefined;

    const returnAmount =
      body.returnAmount !== undefined
        ? body.returnAmount === "" || body.returnAmount === null
          ? null
          : num(body.returnAmount)
        : undefined;

    const capitalEffects = await applyJournalCapitalUpdate(auth!.user.id, row, {
      tradeAmount,
      payoutPercent,
      returnAmount,
      result,
    });

    const needsRefresh = shouldRefreshRiskSummary(
      prevResult,
      result,
      body,
      capitalEffects.lossLimitReached,
    );

    const { row: updated, error: updateError } = await saveJournalRowForUser(
      auth!.user.id,
      row.id,
      {
        olymp_open_time: openTime,
        olymp_opening_quote: opening,
        olymp_closing_quote: closing,
        olymp_trade_id: tradeId,
        loss_reason: body.lossReason ?? row.loss_reason,
        entry_drift: drift,
        entry_status: status,
        result,
        result_source: resultSource,
        marked_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...capitalEffects.patch,
      },
    );

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError || "Update failed" },
        { status: updateError === "Journal record not found" ? 404 : 500 },
      );
    }

    await writeAuditLog({
      userId: auth!.user.id,
      action: "user_journal_update",
      entityType: "trade_journal",
      entityId: updated.id,
      metadata: {
        pair: updated.pair,
        result: updated.result,
        opening: updated.olymp_opening_quote,
        closing: updated.olymp_closing_quote,
      },
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const profileAfter = needsRefresh
      ? await getProfileCapitalFields(auth!.user.id)
      : null;
    let liveModeLocked = capitalEffects.lossLimitReached;
    let cooldownUntil: string | null = null;

    if (needsRefresh && profileAfter) {
      const summaryResult = await refreshDailySummaryFromJournal(
        auth!.user.id,
        {
          ...profileAfter,
          current_capital: capitalEffects.profileCapital ?? profileAfter.current_capital,
        },
        { lockLive: capitalEffects.lossLimitReached },
      );
      liveModeLocked = Boolean(summaryResult.summary?.live_mode_locked);
      cooldownUntil = summaryResult.summary?.cooldown_until ?? null;
      const streak = summaryResult.summary?.consecutive_losses ?? capitalEffects.consecutiveLosses;
      return NextResponse.json({
        row: updated,
        capitalWarning: capitalEffects.capitalWarning,
        risk: {
          lossLimitReached: streak >= profileAfter.max_consecutive_losses,
          consecutiveLosses: streak,
          liveModeLocked,
          cooldownUntil,
          profileCapital: capitalEffects.profileCapital,
        },
      });
    }

    return NextResponse.json({
      row: updated,
      capitalWarning: capitalEffects.capitalWarning,
      risk: {
        lossLimitReached: capitalEffects.lossLimitReached,
        consecutiveLosses: capitalEffects.consecutiveLosses,
        liveModeLocked,
        cooldownUntil,
        profileCapital: capitalEffects.profileCapital,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
