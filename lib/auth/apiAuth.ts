import { getAuthContext } from "./session";
import { NextResponse } from "next/server";

type RequireApiAuthOptions = {
  adminOnly?: boolean;
  activeOnly?: boolean;
};

export async function requireApiAuth(options: RequireApiAuthOptions = {}) {
  const { adminOnly = false, activeOnly = true } = options;
  const auth = await getAuthContext();
  if (!auth) {
    return {
      auth: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (activeOnly && !auth.isActive) {
    return {
      auth: null,
      error: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
    };
  }
  if (adminOnly && !auth.isAdmin) {
    return {
      auth: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { auth, error: null };
}
