import { requireApiAuth } from "@/lib/auth/apiAuth";
import { userNeedsRulesAcknowledgement } from "@/lib/rules/rules";
import { NextResponse } from "next/server";

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const { required, active } = await userNeedsRulesAcknowledgement(auth!.user.id);

  return NextResponse.json({
    ok: true,
    active,
    acknowledged: !required,
    acknowledgementRequired: required,
  });
}
