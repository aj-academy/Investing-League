export function usdLinked(pair: string) {
  return String(pair || "").includes("USD");
}
