import type { Micro2MLabel, Micro2MPermission } from "./types";

/** User-facing labels for Live + 2-minute takeable path. */
export function liveFacingMicroLabel(
  permission: Micro2MPermission,
  livePresentation: boolean,
): string {
  if (!livePresentation) {
    if (permission === "2M_STRONG_MICRO") return "STRONG 2M MICRO TRADE";
    if (permission === "2M_MICRO_TRADE") return "2M MICRO TRADE";
    if (permission === "2M_WATCH") return "2M WATCH";
    return "2M AVOID";
  }

  if (permission === "2M_STRONG_MICRO") return "STRONG 2M TRADE ALLOWED";
  if (permission === "2M_MICRO_TRADE") return "2M TRADE ALLOWED";
  if (permission === "2M_WATCH") return "2M WATCH";
  return "2M AVOID";
}

export function isTakeable2MPermission(permission: Micro2MPermission): boolean {
  return permission === "2M_MICRO_TRADE" || permission === "2M_STRONG_MICRO";
}

export function microLabelForPermission(permission: Micro2MPermission): Micro2MLabel {
  if (permission === "2M_STRONG_MICRO") return "STRONG 2M MICRO TRADE";
  if (permission === "2M_MICRO_TRADE") return "2M MICRO TRADE";
  if (permission === "2M_WATCH") return "2M WATCH";
  return "2M AVOID";
}
