import type { Metadata } from "next";
import { PrivacyPolicyPage } from "@/components/marketing/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | The Investing League",
  description:
    "Privacy Policy for The Investing League — courses, enquiries, and Decision Lab educational scanner member data.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
