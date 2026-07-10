/** Parse Twelve Data (or proxy) JSON bodies; reject HTML/error pages clearly. */
export function parseProviderJson(text: string, httpStatus: number): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(
      httpStatus >= 400
        ? `Market data provider returned HTTP ${httpStatus} with an empty body.`
        : "Market data provider returned an empty response.",
    );
  }

  if (trimmed.startsWith("<") || /<!doctype/i.test(trimmed)) {
    throw new Error(
      "Market data provider returned HTML instead of JSON. Check TWELVE_DATA_API_KEY on Vercel or API credits.",
    );
  }

  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    if (!json || typeof json !== "object") {
      throw new Error("Market data provider returned invalid JSON.");
    }
    return json;
  } catch (e) {
    if (e instanceof Error && e.message.includes("Market data provider")) throw e;
    throw new Error(
      "Market data provider returned invalid JSON. The API may be down or rate-limited.",
    );
  }
}
