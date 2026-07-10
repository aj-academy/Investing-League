export const USER_PROVIDER_ERROR = "An error occurred. Please contact admin.";
export const USER_MARKET_UNAVAILABLE =
  "Market data temporarily unavailable. Please try again later or contact admin.";

const INTERNAL_PROVIDER_PATTERN =
  /twelve\s*data|api\s*limit|api\s*credits|run\s*out\s*of|twelvedata\.com|market\s*data\s*provider|twelve_data_api_key|returned html|invalid json|http\s*\d{3}/i;

const HTML_JSON_PARSE_PATTERN =
  /unexpected token ['"]<|is not valid json|<!doctype|<html/i;

export function isHtmlProviderResponseError(message: string): boolean {
  return HTML_JSON_PARSE_PATTERN.test(message);
}

export function isInternalProviderError(message: string): boolean {
  return INTERNAL_PROVIDER_PATTERN.test(message) || isHtmlProviderResponseError(message);
}

/** Collapse repeated HTML/JSON provider failures into one readable message. */
export function collapseProviderErrors(messages: string[]): string[] {
  if (messages.length <= 1) return messages;

  const htmlErrors = messages.filter(isHtmlProviderResponseError);
  if (htmlErrors.length < 2) return messages;

  const pairs = htmlErrors
    .map((m) => m.split(":")[0]?.trim())
    .filter((p): p is string => Boolean(p));
  const rest = messages.filter((m) => !isHtmlProviderResponseError(m));
  return [
    `Market data unavailable for ${htmlErrors.length} pair(s) (${pairs.join(", ")}). API may be down, misconfigured, or out of credits.`,
    ...rest,
  ];
}

/** Hide market data provider internals from non-admin users. */
export function sanitizeProviderError(message: string, isAdmin: boolean): string {
  if (isHtmlProviderResponseError(message)) {
    return isAdmin
      ? message.replace(
          /Unexpected token.*$/i,
          "Provider returned HTML instead of JSON (check TWELVE_DATA_API_KEY on Vercel).",
        )
      : USER_MARKET_UNAVAILABLE;
  }
  if (isAdmin || !isInternalProviderError(message)) return message;
  return USER_PROVIDER_ERROR;
}

export function sanitizeProviderErrors(messages: string[], isAdmin: boolean): string[] {
  const collapsed = collapseProviderErrors(messages);
  if (isAdmin) return collapsed;
  return collapsed.map((msg) => sanitizeProviderError(msg, false));
}
