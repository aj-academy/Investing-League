import { getActiveTerms } from "@/lib/terms/terms";
import Link from "next/link";

export default async function TermsPage() {
  const active = await getActiveTerms();

  return (
    <div className="auth-wrap z">
      <div className="auth-card" style={{ width: "min(980px, 95vw)", maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h1 style={{ margin: 0 }}>TERMS & CONDITIONS</h1>
          <Link href="/login" className="jbtn" style={{ textDecoration: "none" }}>
            Back
          </Link>
        </div>
        {!active ? (
          <p style={{ fontSize: 12, color: "var(--m3)", lineHeight: 1.7 }}>
            This platform is for educational analysis, signal testing, and trade journaling only.
            It does not guarantee profit and does not provide financial advice. Trading involves
            risk. Users are responsible for their own trading decisions.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 11, color: "var(--m3)" }}>
              {active.title} — Version {active.version}
            </p>
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 11,
                color: "var(--txt2)",
                lineHeight: 1.7,
                border: "1px solid var(--bd)",
                borderRadius: 8,
                background: "var(--p2)",
                padding: 12,
              }}
            >
              {active.content || "No content provided for the active terms document."}
              {active.file_url ? (
                <>
                  {"\n\n"}Reference file: {active.file_url}
                </>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
