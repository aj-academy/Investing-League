"use client";

import Link from "next/link";

export function LossLimitModal({
  onPracticeOnly,
  onPause,
  onViewJournal,
}: {
  onPracticeOnly: () => void;
  onPause: () => void;
  onViewJournal: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,12,.9)",
        zIndex: 1700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div className="ctrl cpp-modal cpp-loss-modal" style={{ width: "min(520px, 96vw)" }}>
        <div className="ctrl-title cpp-loss-title">Stop Trading Now</div>
        <p className="cpp-loss-body">
          You have reached your continuous loss limit. This is the moment to protect your capital.
          Stop live trading, review your journal, and restart only after a break.
        </p>
        <div className="cpp-loss-actions">
          <Link href="/journal" className="btn-scan" onClick={onViewJournal}>
            View Journal
          </Link>
          <button type="button" className="jbtn" onClick={onPracticeOnly}>
            Continue Practice Only
          </button>
          <button type="button" className="jbtn cpp-pause-btn" onClick={onPause}>
            Pause for 30 Minutes
          </button>
        </div>
      </div>
    </div>
  );
}
