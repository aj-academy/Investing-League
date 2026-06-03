import { getProfileByUserId } from "@/lib/auth/profile";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function bearerToken(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

/** Returns whether the signed-in user has an admin profile (no session cookie granted). */
export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const profile = await getProfileByUserId(user.id);
  const isAdmin = profile?.role === "admin" && profile.is_active !== false;

  return NextResponse.json({ isAdmin });
}
