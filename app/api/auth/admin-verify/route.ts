import { getProfileByUserId } from "@/lib/auth/profile";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function bearerToken(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim();
}

/** Verify signed-in user is an active admin (uses service role for profile read). */
export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing session token. Sign in again." },
      { status: 401 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Server missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel env and redeploy.",
      },
      { status: 503 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired session. Sign in again." },
      { status: 401 }
    );
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json(
      {
        ok: false,
        error: "No profile row for this account. Run profile backfill in Supabase.",
      },
      { status: 403 }
    );
  }

  if (profile.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "This account is not an admin." },
      { status: 403 }
    );
  }

  if (profile.is_active === false) {
    return NextResponse.json(
      { ok: false, error: "This admin account is suspended." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
