export function journalToJson(rows: unknown[]) {
  return JSON.stringify(rows, null, 2);
}
