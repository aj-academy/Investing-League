import type { Metadata } from "next";
import SiteFooter from "@/components/layout/SiteFooter";
import { InspectGuardRoot } from "@/components/security/InspectGuardRoot";
import { DEFAULT_OG_IMAGE, PAGE_SEO, SITE_NAME, SITE_URL } from "@/lib/marketing/seo";
import { Toaster } from "sonner";

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
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="192x192" />
      </head>
      <body>
        <InspectGuardRoot />
        {children}
        <Toaster theme="dark" position="top-right" richColors />
        <SiteFooter />
      </body>
    </html>
  );
}
