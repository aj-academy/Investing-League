import type { Metadata } from "next";
import PremiumLanding from "@/components/landing/PremiumLanding";
import { PAGE_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.decisionLab.title,
  description: PAGE_SEO.decisionLab.description,
};

export default function DecisionLabPage() {
  return <PremiumLanding />;
}
