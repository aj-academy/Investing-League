"use client";

import { DatePickerField } from "@/components/ui/DatePickerField";
import { PLATFORM_RISK_DISCLAIMER } from "@/lib/platform/userCopy";
import { resolveWeeklyProfitTarget } from "@/lib/risk/capitalProtection";
import type { RecoveryMetrics, RiskStatus } from "@/lib/risk/types";

function riskClass(status: RiskStatus) {
  if (status === "stop") return "cpp-risk-stop";
  if (status === "caution") return "cpp-risk-caution";
  return "cpp-risk-normal";
}

function riskLabel(status: RiskStatus) {
  if (status === "stop") return "Stop Trading";
  if (status === "caution") return "Caution";
  return "Normal";
}

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CapitalProtectionCard({
  startingCapital,
  currentCapital,
  todayNetProfit,
  weekNetProfit,
  consecutiveLosses,
  riskStatus,
  liveModeLocked,
  riskPerTradePercent,
  dailyProfitTargetPercent,
  weeklyProfitTargetAmount,
  weekTargetFrom,
  weekTargetTo,
  dailyLossLimitPercent,
  maxConsecutiveLosses,
  recovery,
  onEdit,
}: {
  startingCapital: number;
  currentCapital: number;
  todayNetProfit: number;
  weekNetProfit: number;
  consecutiveLosses: number;
  riskStatus: RiskStatus;
  liveModeLocked: boolean;
  riskPerTradePercent: number;
  dailyProfitTargetPercent: number;
  weeklyProfitTargetAmount: number;
  weekTargetFrom: string;
  weekTargetTo: string;
  dailyLossLimitPercent: number;
  maxConsecutiveLosses: number;
  recovery: RecoveryMetrics | null;
  onEdit?: () => void;
}) {
  const planActive = startingCapital > 0;
  const riskPerTradeAmt = planActive ? (currentCapital * riskPerTradePercent) / 100 : 0;
  const dailyLossLimitAmt = planActive ? (startingCapital * dailyLossLimitPercent) / 100 : 0;
  const dailyProfitTargetAmt =
    planActive && dailyProfitTargetPercent > 0
      ? (startingCapital * dailyProfitTargetPercent) / 100
      : 0;
  const weeklyProfitTargetAmt = planActive
    ? resolveWeeklyProfitTarget(weeklyProfitTargetAmount)
    : 0;
  const weeklyProgressPct =
    weeklyProfitTargetAmt > 0
      ? Math.min(100, Math.max(0, (weekNetProfit / weeklyProfitTargetAmt) * 100))
      : 0;
  const weeklyTargetReached =
    weeklyProfitTargetAmt > 0 && weekNetProfit >= weeklyProfitTargetAmt;
  const capitalDelta = currentCapital - startingCapital;
  const capitalDeltaPct =
    planActive && startingCapital > 0 ? (capitalDelta / startingCapital) * 100 : 0;

  return (
    <div className="ctrl cpp-card">
      <div className="cpp-card-head">
        <div>
          <div className="ctrl-title">Capital Protection</div>
          <p className="cpp-card-sub">
            {planActive
              ? "Your discipline plan is active — limits apply to Live Mode and journal tracking."
              : "Set starting capital to activate your protection plan."}
          </p>
        </div>
        {onEdit && (
          <button type="button" className="jbtn" onClick={onEdit}>
            {planActive ? "Edit plan" : "Set up plan"}
          </button>
        )}
      </div>

      {!planActive ? (
        <div className="cpp-empty-state">
          <p>
            Add your starting capital and limits so the Decision Lab can track today&apos;s P/L,
            loss streaks, and pause Live Mode when your rules are hit.
          </p>
        </div>
      ) : (
        <>
          <div className="journal-stats cpp-stats">
            <div className="jstat">
              <div className="jstat-v">{fmtMoney(startingCapital)}</div>
              <div className="jstat-l">Starting Capital</div>
            </div>
            <div className="jstat">
              <div className="jstat-v">{fmtMoney(currentCapital)}</div>
              <div className="jstat-l">Current Capital</div>
            </div>
            <div className="jstat">
              <div
                className="jstat-v"
                style={{ color: todayNetProfit >= 0 ? "var(--bull)" : "var(--bear)" }}
              >
                {fmtMoney(todayNetProfit)}
              </div>
              <div className="jstat-l">Today P/L</div>
            </div>
            <div className="jstat">
              <div
                className="jstat-v"
                style={{ color: weekNetProfit >= 0 ? "var(--bull)" : "var(--bear)" }}
              >
                {fmtMoney(weekNetProfit)}
              </div>
              <div className="jstat-l">This Week P/L</div>
            </div>
            <div className="jstat">
              <div
                className="jstat-v"
                style={{ color: capitalDelta >= 0 ? "var(--bull)" : "var(--bear)" }}
              >
                {capitalDeltaPct.toFixed(1)}%
              </div>
              <div className="jstat-l">vs Starting</div>
            </div>
            <div className="jstat">
              <div className="jstat-v">{consecutiveLosses}</div>
              <div className="jstat-l">Loss Streak</div>
            </div>
            <div className="jstat">
              <div className={`jstat-v ${riskClass(riskStatus)}`}>{riskLabel(riskStatus)}</div>
              <div className="jstat-l">Risk Status</div>
            </div>
            <div className="jstat">
              <div
                className="jstat-v"
                style={{ color: liveModeLocked ? "var(--bear)" : "var(--bull)" }}
              >
                {liveModeLocked ? "Paused" : "Active"}
              </div>
              <div className="jstat-l">Live Mode</div>
            </div>
          </div>

          <div className="cpp-plan-limits">
            <div className="cpp-limit-item">
              <span className="cpp-limit-label">Risk per trade</span>
              <strong>
                {riskPerTradePercent}% · ~{fmtMoney(riskPerTradeAmt)}
              </strong>
              <span className="cpp-limit-hint">Based on current capital</span>
            </div>
            <div className="cpp-limit-item">
              <span className="cpp-limit-label">Daily profit target</span>
              <strong>
                {dailyProfitTargetPercent}% · ~{fmtMoney(dailyProfitTargetAmt)}
              </strong>
              <span className="cpp-limit-hint">Daily reference from starting capital</span>
            </div>
            <div className="cpp-limit-item">
              <span className="cpp-limit-label">Target for the week</span>
              <strong>{weeklyProfitTargetAmt > 0 ? fmtMoney(weeklyProfitTargetAmt) : "—"}</strong>
              <span className="cpp-limit-hint">
                {weeklyProfitTargetAmt <= 0
                  ? "Set amount and week dates in your plan"
                  : weeklyTargetReached
                    ? "Weekly target reached — consider stopping for discipline"
                    : `${weekTargetFrom} → ${weekTargetTo}: ${fmtMoney(weekNetProfit)} of ${fmtMoney(weeklyProfitTargetAmt)}`}
              </span>
              {weeklyProfitTargetAmt > 0 && (
                <div className="cpp-target-progress" aria-hidden>
                  <div
                    className="cpp-target-progress-fill"
                    style={{
                      width: `${weeklyProgressPct}%`,
                      background: weeklyTargetReached ? "var(--bull)" : "var(--gold2)",
                    }}
                  />
                </div>
              )}
            </div>
            <div className="cpp-limit-item">
              <span className="cpp-limit-label">Daily loss limit</span>
              <strong>
                {dailyLossLimitPercent}% · ~{fmtMoney(dailyLossLimitAmt)}
              </strong>
              <span className="cpp-limit-hint">Stop if today P/L exceeds this</span>
            </div>
            <div className="cpp-limit-item">
              <span className="cpp-limit-label">Consecutive loss stop</span>
              <strong>{maxConsecutiveLosses} losses</strong>
              <span className="cpp-limit-hint">Pauses Live Mode + shows warning</span>
            </div>
          </div>

          {recovery?.message && (
            <div className="cpp-recovery-warn">{recovery.message}</div>
          )}

          <div className="cpp-how-it-works">
            <div className="cpp-how-title">How it works</div>
            <ul className="cpp-how-list">
              <li>Set starting and current capital — journal trade results update current capital.</li>
              <li>
                Today P/L and loss streak count settled journal results (Win / Loss / Refund) for
                today only. This week P/L uses your selected week dates (UTC).
              </li>
              <li>
                After {maxConsecutiveLosses} consecutive losses, Live Mode pauses for capital
                protection. Practice Mode stays available.
              </li>
              <li>
                Risk status turns Caution or Stop Trading when daily loss or streak limits are
                approached — not a profit guarantee.
              </li>
              <li>Your goal is disciplined decisions, not recovering losses quickly.</li>
            </ul>
          </div>
        </>
      )}

      <p className="cpp-disclaimer cpp-card-footer">{PLATFORM_RISK_DISCLAIMER}</p>
    </div>
  );
}

export function CapitalProtectionModal({
  open,
  saving,
  values,
  recovery,
  migrationWarning,
  onChange,
  onSave,
  onClose,
}: {
  open: boolean;
  saving: boolean;
  migrationWarning?: string | null;
  values: {
    startingCapital: number;
    currentCapital: number;
    riskPerTradePercent: number;
    dailyProfitTargetPercent: number;
    weeklyProfitTargetAmount: number;
    weeklyTargetFrom: string;
    weeklyTargetTo: string;
    dailyLossLimitPercent: number;
    maxConsecutiveLosses: number;
  };
  recovery: RecoveryMetrics | null;
  onChange: (patch: Partial<typeof values>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const riskAmt =
    values.currentCapital > 0
      ? ((values.currentCapital * values.riskPerTradePercent) / 100).toFixed(2)
      : "—";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,12,.85)",
        zIndex: 1550,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="ctrl cpp-modal"
        style={{
          width: "min(520px, 96vw)",
          maxHeight: "min(90vh, 720px)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ctrl-title">Capital Protection Plan</div>
        <p className="cpp-plan-intro">
          Your goal is not to recover losses quickly. Your goal is to protect capital and make
          disciplined decisions.
        </p>
        {migrationWarning && <div className="cpp-recovery-warn">{migrationWarning}</div>}
        <div className="cpp-form-grid">
          <div className="cpp-field">
            <label>Starting Capital</label>
            <input
              className="cpp-input key-in"
              type="number"
              min={0}
              step="0.01"
              value={values.startingCapital}
              onChange={(e) => onChange({ startingCapital: Number(e.target.value) })}
            />
          </div>
          <div className="cpp-field">
            <label>Current Capital</label>
            <input
              className="cpp-input key-in"
              type="number"
              min={0}
              step="0.01"
              value={values.currentCapital}
              onChange={(e) => onChange({ currentCapital: Number(e.target.value) })}
            />
          </div>
          <div className="cpp-field">
            <label>Risk per Trade %</label>
            <input
              className="cpp-input key-in"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={values.riskPerTradePercent}
              onChange={(e) => onChange({ riskPerTradePercent: Number(e.target.value) })}
            />
          </div>
          <div className="cpp-field">
            <label>Daily Profit Target %</label>
            <input
              className="cpp-input key-in"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={values.dailyProfitTargetPercent}
              onChange={(e) => onChange({ dailyProfitTargetPercent: Number(e.target.value) })}
            />
            <span className="cpp-field-hint">
              Daily reference target from starting capital (e.g. 10% of 10,000 = 1,000/day).
            </span>
          </div>
          <div className="cpp-field">
            <label>Week From</label>
            <DatePickerField
              className="cpp-input date-picker-input"
              value={values.weeklyTargetFrom}
              max={values.weeklyTargetTo || undefined}
              onChange={(weeklyTargetFrom) => onChange({ weeklyTargetFrom })}
            />
          </div>
          <div className="cpp-field">
            <label>Week To</label>
            <DatePickerField
              className="cpp-input date-picker-input"
              value={values.weeklyTargetTo}
              min={values.weeklyTargetFrom || undefined}
              onChange={(weeklyTargetTo) => onChange({ weeklyTargetTo })}
            />
            <span className="cpp-field-hint">Pick the week range — calendar only, no typing.</span>
          </div>
          <div className="cpp-field">
            <label>Target for the Week</label>
            <input
              className="cpp-input key-in"
              type="number"
              min={0}
              step="0.01"
              value={values.weeklyProfitTargetAmount}
              onChange={(e) => onChange({ weeklyProfitTargetAmount: Number(e.target.value) })}
            />
            <span className="cpp-field-hint">Fixed profit goal for the selected week range.</span>
          </div>
          <div className="cpp-field">
            <label>Daily Loss Limit %</label>
            <input
              className="cpp-input key-in"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={values.dailyLossLimitPercent}
              onChange={(e) => onChange({ dailyLossLimitPercent: Number(e.target.value) })}
            />
          </div>
          <div className="cpp-field">
            <label>Stop After Consecutive Losses</label>
            <input
              className="cpp-input key-in"
              type="number"
              min={1}
              max={20}
              step={1}
              value={values.maxConsecutiveLosses}
              onChange={(e) => onChange({ maxConsecutiveLosses: Number(e.target.value) })}
            />
          </div>
        </div>
        <p className="cpp-plan-preview">
          At {values.riskPerTradePercent}% risk, suggested reference trade size from current
          capital: <strong>{riskAmt}</strong> (reference only).
          {values.weeklyProfitTargetAmount > 0 ? (
            <>
              {" "}
              Target for the week: <strong>{values.weeklyProfitTargetAmount}</strong>
              {values.weeklyTargetFrom && values.weeklyTargetTo ? (
                <>
                  {" "}
                  ({values.weeklyTargetFrom} → {values.weeklyTargetTo})
                </>
              ) : null}
              .
            </>
          ) : null}
        </p>
        {recovery?.message && <div className="cpp-recovery-warn">{recovery.message}</div>}
        <p className="cpp-disclaimer">{PLATFORM_RISK_DISCLAIMER}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="button" className="btn-scan" disabled={saving} onClick={onSave}>
            {saving ? "Saving..." : "Save Plan"}
          </button>
          <button type="button" className="jbtn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
