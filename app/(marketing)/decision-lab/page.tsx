import type { Metadata } from "next";
import Link from "next/link";
import { DecisionLabPage } from "@/components/marketing/DecisionLabPage";

export const metadata: Metadata = {
  title: "Decision Lab Scanner | The Investing League",
  description:
    "Educational market scanner for market observation, signal testing, journaling, and risk-aware learning.",
};

export default function Page() {
  return <DecisionLabPage />;
}
