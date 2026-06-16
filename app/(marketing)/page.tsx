import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/MarketingHome";
import { PAGE_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
};

export default function HomePage() {
  return <MarketingHome />;
}
