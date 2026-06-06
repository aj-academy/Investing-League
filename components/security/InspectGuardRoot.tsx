import { getAuthContext } from "@/lib/auth/session";
import { InspectGuard } from "./InspectGuard";

/** Server wrapper — admins with an unlocked admin session can inspect freely. */
export async function InspectGuardRoot() {
  const auth = await getAuthContext();
  return <InspectGuard enabled={!auth?.isAdmin} />;
}
