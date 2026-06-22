import { PLATFORM_SAVE_FAILED, PLATFORM_SERVICE_UNAVAILABLE } from "./userCopy";

const INTERNAL_PATTERN =
  /supabase|twelve\s*data|twelvedata|api\s*limit|api\s*credits|run\s*out\s*of|service_role|pgrst|row-level security|migration|\.sql|vercel env|schema cache|not configured|capital_protection_plan|v9_signal_layers/i;

export function sanitizeUserFacingError(
  message: string | undefined | null,
  fallback = PLATFORM_SAVE_FAILED,
): string {
  if (!message?.trim()) return fallback;
  if (INTERNAL_PATTERN.test(message)) return fallback;
  return message;
}

export function sanitizeUserFacingErrors(
  messages: string[],
  fallback = PLATFORM_SAVE_FAILED,
): string[] {
  return messages.map((msg) => sanitizeUserFacingError(msg, fallback));
}

export function sanitizeServiceWarning(message: string | undefined | null): string {
  return sanitizeUserFacingError(message, PLATFORM_SERVICE_UNAVAILABLE);
}
