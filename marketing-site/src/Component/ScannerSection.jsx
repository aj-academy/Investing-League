import { DECISION_LAB_LOGIN_URL } from "../lib/config";

const SAMPLE_SIGNALS = [
  {
    permission: "allowed",
    label: "TRADE ALLOWED",
    pair: "EUR/USD · CALL",
    grade: "A+ · STRONG FINAL",
    note: "Fresh setup near candle open — verify platform quote.",
  },
  {
    permission: "observe",
    label: "OBSERVE ONLY",
    pair: "GBP/USD · PUT",
    grade: "A · WATCH ONLY",
    note: "Valid setup quality but not top permission for live entry.",
  },
  {
    permission: "blocked",
    label: "DO NOT TRADE",
    pair: "USD/JPY · CALL",
    grade: "LATE ENTRY",
    note: "Overextended move — educational observation only.",
  },
];

export function ScannerSection() {
  return (
    <section className="py-16 bg-gray-900 text-white" id="scanner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-2">
            Decision Lab
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            V8 Market Scanner
          </h2>
          <div className="w-20 h-1 bg-green-500 mx-auto mb-6" />
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Educational FX setup analysis with a clear permission box on every signal — not just
            grades. Practice setups, journal results, and improve with analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {SAMPLE_SIGNALS.map((sig) => (
            <div
              key={sig.label}
              className="rounded-xl border border-gray-700 bg-gray-800/80 p-5 shadow-lg"
            >
              <div
                className={`text-xs font-bold tracking-wide mb-3 px-3 py-2 rounded-lg ${
                  sig.permission === "allowed"
                    ? "bg-green-900/50 text-green-400 border border-green-700"
                    : sig.permission === "observe"
                      ? "bg-amber-900/30 text-amber-300 border border-amber-700/50"
                      : "bg-red-900/30 text-red-400 border border-red-800/50"
                }`}
              >
                {sig.permission === "allowed" ? "✅" : sig.permission === "observe" ? "⚠️" : "⛔"}
                {sig.label}
              </div>
              <p className="text-white font-semibold mb-1">{sig.pair}</p>
              <p className="text-green-400 text-sm mb-3">{sig.grade}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{sig.note}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={DECISION_LAB_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg"
          >
            Open Decision Lab Scanner
          </a>
          <a
            href="#cta-enroll"
            className="inline-flex items-center justify-center border border-gray-500 text-gray-200 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Request syllabus on WhatsApp
          </a>
        </div>

        <p className="text-center text-gray-500 text-xs mt-8 max-w-2xl mx-auto leading-relaxed">
          Educational decision-support only. Not financial advice. Sample cards above illustrate
          permission types — live scans, journal, and analytics run in the Decision Lab after you
          sign in.
        </p>
      </div>
    </section>
  );
}
