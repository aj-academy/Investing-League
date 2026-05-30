import { DEMO_COOKIE } from "@/lib/auth/demo";
import { isDemoCredentials } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "");
  const password = String(body.password || "");

  if (!isDemoCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid demo credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, demo: true });
  res.cookies.set(DEMO_COOKIE, "active", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
