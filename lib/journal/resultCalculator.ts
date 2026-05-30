export type TradeResult = "Pending" | "Win" | "Loss" | "Refund";

export function calculateResult(
  direction: "CALL" | "PUT",
  opening: number | null,
  closing: number | null
): TradeResult {
  if (opening === null || closing === null || !Number.isFinite(opening) || !Number.isFinite(closing)) {
    return "Pending";
  }
  if (opening === closing) return "Refund";
  if (direction === "CALL") return closing > opening ? "Win" : "Loss";
  return closing < opening ? "Win" : "Loss";
}
