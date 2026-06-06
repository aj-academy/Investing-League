export const USER_PROVIDER_ERROR = "An error occurred. Please contact admin.";

const INTERNAL_PROVIDER_PATTERN =
  /twelve\s*data|api\s*limit|api\s*credits|run\s*out\s*of|twelvedata\.com|market\s*data\s*provider\s*is\s*not\s*configured/i;

export function isInternalProviderError(message: string): boolean {
  return INTERNAL_PROVIDER_PATTERN.test(message);
}

/** Hide Twelve Data / provider internals from non-admin users. */
export function sanitizeProviderError(message: string, isAdmin: boolean): string {
  if (isAdmin || !isInternalProviderError(message)) return message;
  return USER_PROVIDER_ERROR;
}

export function sanitizeProviderErrors(messages: string[], isAdmin: boolean): string[] {
  if (isAdmin) return messages;
  return messages.map((msg) => sanitizeProviderError(msg, false));
}
