import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getProfileByUserId } from "@/lib/auth/profile";
import { NextResponse } from "next/server";

export async function requireAdminApi() {
  const { auth, error } = await requireApiAuth({ adminOnly: true });
  if (error) return { auth: null, error };

  const profile = await getProfileByUserId(auth!.user.id);
  if (!profile || profile.role !== "admin" || profile.is_active === false) {
    return {
      auth: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { auth, error: null };
}
