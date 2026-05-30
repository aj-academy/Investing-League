export const DEMO_EMAIL = "sample@gmail.com";
export const DEMO_PASSWORD = "12345678";
export const DEMO_COOKIE = "til_demo_auth";
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export function isDemoCredentials(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEMO_EMAIL &&
    password === DEMO_PASSWORD
  );
}

export function isDemoSessionValue(value: string | undefined) {
  return value === "active";
}

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  full_name: "Demo Trader",
  role: "admin" as const,
  plan: "free",
  risk_disclaimer_accepted: true,
};
