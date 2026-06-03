/** Clear admin-panel session cookie (call before Supabase signOut). */
export async function clearAdminSession() {
  try {
    await fetch("/api/auth/admin-session/clear", { method: "POST" });
  } catch {
    /* ignore network errors during logout */
  }
}
