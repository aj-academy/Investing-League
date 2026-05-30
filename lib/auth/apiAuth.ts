import { getAuthContext } from "./session";
import { NextResponse } from "next/server";

export async function requireApiAuth() {
  const auth = await getAuthContext();
  if (!auth) {
    return {
      auth: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { auth, error: null };
}
