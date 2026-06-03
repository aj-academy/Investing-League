import type { Metadata } from "next";
import PremiumLanding from "@/components/landing/PremiumLanding";
import "./landing.css";

export const metadata: Metadata = {
  title: "The Investing League — Trading Decision Lab",
  description:
    "The Investing League Trading Decision Lab — AI-powered market intelligence for disciplined traders. Educational scanner, journal analytics, and risk-aware signal testing.",
};

export default function HomePage() {
  return <PremiumLanding />;
}
