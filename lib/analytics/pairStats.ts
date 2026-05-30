export function bestByKey<T extends { result?: string | null }>(
  rows: T[],
  key: keyof T
) {
  const stats: Record<string, { w: number; l: number }> = {};
  rows.forEach((r) => {
    if (r.result !== "Win" && r.result !== "Loss") return;
    const k = String(r[key] ?? "—") as string;
    if (!stats[k]) stats[k] = { w: 0, l: 0 };
    if (r.result === "Win") stats[k].w++;
    else stats[k].l++;
  });
  let best = "—";
  let bestRate = -1;
  Object.entries(stats).forEach(([k, v]) => {
    const total = v.w + v.l;
    if (!total) return;
    const rate = v.w / total;
    if (rate > bestRate) {
      bestRate = rate;
      best = k;
    }
  });
  return best;
}
