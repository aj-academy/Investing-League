import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getActiveTerms, getUserAcceptedTerms } from "@/lib/terms/terms";
import { NextResponse } from "next/server";

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const active = await getActiveTerms();
  if (!active) {
    return NextResponse.json({
      ok: true,
      active: null,
      accepted: true,
    });
  }

  const acceptance = await getUserAcceptedTerms(auth!.user.id, active.id);
  return NextResponse.json({
    ok: true,
    active,
    accepted: acceptance.accepted,
    acceptedAt: acceptance.accepted_at || null,
  });
}
