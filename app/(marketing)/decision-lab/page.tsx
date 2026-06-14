import type { Metadata } from "next";
import PremiumLanding from "@/components/landing/PremiumLanding";

export const metadata: Metadata = {
  title: "Decision Lab Scanner | The Investing League",
  description:
    "Preview the educational market scanner with eight major FX pairs — sample data for learning and observation only.",
};

export default function DecisionLabPage() {
  return <PremiumLanding />;
}
