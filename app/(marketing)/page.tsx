import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/MarketingHome";

export const metadata: Metadata = {
  title: "The Investing League | Finance Courses & Educational Market Scanner",
  description:
    "Learn finance practically and explore Decision Lab, an educational market scanner for disciplined market observation and risk-aware learning.",
};

export default function HomePage() {
  return <MarketingHome />;
}
