/** Default for India-focused deployment when client timezone is unavailable. */
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

export function resolveTimeZone(preferred?: string | null): string {
  const tz = String(preferred || "").trim();
  if (!tz) return DEFAULT_TIME_ZONE;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function formatClockTime(date: Date, timeZone: string): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone,
  });
}

export function formatSignalTime(date: Date, timeZone: string): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone,
  });
}

export function timeZoneAbbreviation(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value || timeZone;
  } catch {
    return timeZone;
  }
}
