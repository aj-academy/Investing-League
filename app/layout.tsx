import type { Metadata } from "next";
import SiteFooter from "@/components/layout/SiteFooter";
import { InspectGuardRoot } from "@/components/security/InspectGuardRoot";
import { DEFAULT_OG_IMAGE, PAGE_SEO, SITE_NAME, SITE_URL } from "@/lib/marketing/seo";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Finance Learning & Educational Decision Lab`,
    template: `%s | ${SITE_NAME}`,
  },
  description: PAGE_SEO.home.description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Finance Learning & Educational Decision Lab`,
    description: PAGE_SEO.home.description,
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Finance Learning & Educational Decision Lab`,
    description: PAGE_SEO.home.description,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [{ url: "/Icon.png", type: "image/png" }],
    shortcut: "/Icon.png",
    apple: "/Icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <InspectGuardRoot />
        {children}
        <Toaster theme="dark" position="top-right" richColors />
        <SiteFooter />
      </body>
    </html>
  );
}
