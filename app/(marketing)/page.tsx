import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/MarketingHome";

export const metadata: Metadata = {
  title: "The Investing League — Financial Education & Decision Lab",
  description:
    "We teach people how to grow wealth through knowledge and smart investing. Courses, syllabus on WhatsApp, and the V8 Market Scanner in the Decision Lab.",
};

export default function HomePage() {
  return <MarketingHome />;
}
