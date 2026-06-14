import type { Metadata } from "next";
import { PlansPage } from "@/components/marketing/PlansPage";

export const metadata: Metadata = {
  title: "Plans | The Investing League",
  description:
    "Explore course, scanner, and bundle access plans from The Investing League.",
};

export default function Page() {
  return <PlansPage />;
}
