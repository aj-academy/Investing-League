import { NextResponse } from "next/server";

/** Returns the visitor IP for the inspect-guard notice (best-effort behind proxies). */
export async function GET(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "Unknown";
  return NextResponse.json({ ip });
}
