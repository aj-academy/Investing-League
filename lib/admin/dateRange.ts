/** Parse admin `from` / `to` query params (YYYY-MM-DD, UTC day bounds). */
export function parseAdminDateRange(searchParams: URLSearchParams) {
  const today = new Date();
  const toDefault = today.toISOString().slice(0, 10);
  const weekAgo = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6)
  );
  const fromDefault = weekAgo.toISOString().slice(0, 10);

  const from = searchParams.get("from") || fromDefault;
  const to = searchParams.get("to") || toDefault;
  const fromIso = new Date(`${from}T00:00:00.000Z`).toISOString();
  const toIso = new Date(`${to}T23:59:59.999Z`).toISOString();

  return { from, to, fromIso, toIso };
}

export function utcDayKey(createdAt: string): string {
  return createdAt.slice(0, 10);
}
