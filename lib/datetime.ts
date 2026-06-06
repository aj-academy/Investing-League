/** Default for India-focused deployment when client timezone is unavailable. */
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

/** Locale that renders dates as dd/mm/yyyy across the app. */
export const APP_DATE_LOCALE = "en-GB";

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Display date as dd/mm/yyyy. */
export function formatAppDate(value: Date | string | number, timeZone?: string): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(APP_DATE_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  });
}

/** Display date and time as dd/mm/yyyy, HH:mm:ss. */
export function formatAppDateTime(value: Date | string | number, timeZone?: string): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleString(APP_DATE_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  });
}

/** dd/mm/yyyy with slashes — used by V8 journal matching. */
export function formatAppDateSlash(
  value: Date | string | number,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const date = toDate(value);
  if (!date) return "—";
  const parts = new Intl.DateTimeFormat(APP_DATE_LOCALE, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const dd = parts.find((p) => p.type === "day")?.value ?? "01";
  const mm = parts.find((p) => p.type === "month")?.value ?? "01";
  const yyyy = parts.find((p) => p.type === "year")?.value ?? "1970";
  return `${dd}/${mm}/${yyyy}`;
}

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

/** Display time as HH:mm:ss (24-hour). */
export function formatAppTime(value: Date | string | number, timeZone?: string): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleTimeString(APP_DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  });
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
