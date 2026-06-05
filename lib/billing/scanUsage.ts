import type { PlanName } from "./planLimits";
import { getPlanLimits } from "./planLimits";
import { getScansUsedToday } from "./scanMetrics";

export { getScansUsedToday } from "./scanMetrics";

export async function canScanToday(userId: string, plan: PlanName): Promise<{
  allowed: boolean;
  scansUsedToday: number;
  dailyScanLimit: number;
  scansRemainingToday: number;
}> {
  const dailyScanLimit = getPlanLimits(plan).dailyScanLimit;
  const scansUsedToday = await getScansUsedToday(userId);
  const scansRemainingToday = Math.max(0, dailyScanLimit - scansUsedToday);
  return {
    allowed: scansUsedToday < dailyScanLimit,
    scansUsedToday,
    dailyScanLimit,
    scansRemainingToday,
  };
}
