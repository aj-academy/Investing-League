/** HttpOnly cookie set only after explicit admin-panel sign-in (open-admin flow). */
export const ADMIN_SESSION_COOKIE = "til_admin_session";

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export function hasAdminSessionCookie(cookies: { get: (name: string) => { value: string } | undefined }) {
  return cookies.get(ADMIN_SESSION_COOKIE)?.value === "1";
}
