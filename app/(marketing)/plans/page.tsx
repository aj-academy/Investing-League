import type { Metadata } from "next";
import { PlansPage } from "@/components/marketing/PlansPage";
import { PAGE_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.plans.title,
  description: PAGE_SEO.plans.description,
};

export default function Page() {
  return <PlansPage />;
}
