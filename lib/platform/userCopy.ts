/** User-facing copy inside Decision Lab — no vendor or “educational” wording. */

export const PLATFORM_DISCLAIMER =
  "This platform provides market analysis, signal testing, and trade journaling tools. It does not guarantee profit or provide financial advice. Trading involves risk. You are responsible for your own decisions.";

export const PLATFORM_RISK_DISCLAIMER =
  "Use disciplined risk rules. This platform does not guarantee profit or provide financial advice. Trading involves risk.";

export const PLATFORM_LOGIN_RULES = [
  "Use this platform for structured analysis and trade journaling.",
  "Trade only when the system says Trade Allowed.",
  "Do not trade Watch Only, Late Entry, Repeated Signal, Trend Exhausted, or Do Not Trade setups.",
  "Do not increase trade amount after a loss.",
  "Stop after your daily loss limit or continuous loss limit.",
  "Always verify platform opening and closing quotes.",
  "Your goal is not more trades. Your goal is better decisions.",
] as const;

export const PLATFORM_TERMS_FALLBACK =
  "This platform provides market analysis, signal testing, and trade journaling tools. It does not guarantee profit or provide financial advice. Trading involves risk. You are responsible for your own decisions.";

export const PLATFORM_SERVICE_UNAVAILABLE =
  "Service is temporarily unavailable. Please try again later or contact support.";

export const PLATFORM_SAVE_FAILED =
  "Could not save your data right now. Please try again or contact support.";

export const PLATFORM_CAPITAL_UNAVAILABLE =
  "Capital protection is not available yet. Please contact support if this continues.";

export const PLATFORM_WEEKLY_TARGET_AMOUNT_PENDING =
  "Plan saved. Your weekly target could not be stored yet — other limits were saved.";

export const PLATFORM_RULES_SAVE_PENDING =
  "Rules acknowledged for today. Sync to server is pending — try again shortly.";

export const PLATFORM_RULES_SAVE_FAILED =
  "Could not save acknowledgement. Popup closed for this session — try again on next login.";

export const PLATFORM_JOURNAL_PARTIAL_SAVE =
  "Journal entry saved with limited detail. Contact support if capital or layer fields are missing.";

export const PLATFORM_SETUP_REQUIRED =
  "The platform is not fully configured yet. Please contact support.";
