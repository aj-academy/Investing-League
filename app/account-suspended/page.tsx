import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <div className="auth-wrap z">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <h1>ACCOUNT SUSPENDED</h1>
        <p style={{ fontSize: 11, color: "var(--m3)", marginBottom: 16 }}>
          Your account access has been suspended. Please contact The Investing League support.
        </p>
        <Link
          href="/login"
          className="jbtn"
          style={{ display: "inline-block", textDecoration: "none" }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
