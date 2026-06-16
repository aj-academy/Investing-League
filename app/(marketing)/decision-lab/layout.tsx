import { Cinzel, Inter } from "next/font/google";
import "../../landing.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

export default function DecisionLabLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${inter.variable} ${cinzel.variable}`}>{children}</div>;
}

