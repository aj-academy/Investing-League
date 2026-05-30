export function getCurrentSession() {
  const h = new Date().getUTCHours();
  const s: { n: string; s: string; hot: boolean }[] = [];
  if (h >= 0 && h < 7) s.push({ n: "Asian", s: "asian", hot: false });
  if (h >= 7 && h < 9) s.push({ n: "Pre-London", s: "pre", hot: false });
  if (h >= 8 && h < 17) s.push({ n: "London", s: "london", hot: true });
  if (h >= 12 && h < 17) s.push({ n: "NY Overlap", s: "overlap", hot: true });
  if (h >= 13 && h < 22) s.push({ n: "New York", s: "newyork", hot: true });
  if (h >= 17 && h < 22) s.push({ n: "NY Late", s: "nylate", hot: false });
  return s;
}

export function sessionOk(sess: string) {
  const cur = getCurrentSession().map((s) => s.s);
  if (sess === "any") return true;
  if (sess === "overlap") return cur.includes("overlap");
  return cur.includes(sess);
}

export function getSessionQualityScore() {
  const cur = getCurrentSession().map((s) => s.s);
  if (cur.includes("overlap")) return 100;
  if (cur.includes("london")) return 85;
  if (cur.includes("newyork")) return 80;
  if (cur.includes("pre")) return 55;
  if (cur.includes("asian")) return 45;
  return 40;
}

export const SESSION_LABELS = [
  { n: "Asian 00-07 UTC", s: "asian" },
  { n: "London 08-17 UTC", s: "london" },
  { n: "NY Overlap 12-17 UTC", s: "overlap" },
  { n: "New York 13-22 UTC", s: "newyork" },
];
