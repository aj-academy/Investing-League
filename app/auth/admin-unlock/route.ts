import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from "@/lib/auth/adminSession";
import { getProfileByUserId } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Sets admin-panel cookie via document navigation (fetch cannot apply Set-Cookie). */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?admin=1`);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.redirect(`${origin}/login?admin=1&error=server_config`);
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.redirect(`${origin}/login?admin=1&error=no_profile`);
  }
  if (profile.role !== "admin") {
    return NextResponse.redirect(`${origin}/dashboard`);
  }
  if (profile.is_active === false) {
    return NextResponse.redirect(`${origin}/account-suspended`);
  }

  const response = NextResponse.redirect(`${origin}/admin`);
  response.cookies.set(ADMIN_SESSION_COOKIE, "1", adminSessionCookieOptions());
  return response;
}
