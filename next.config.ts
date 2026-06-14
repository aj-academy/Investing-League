import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/course", destination: "/courses", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/scanner-info", destination: "/decision-lab", permanent: true },
      { source: "/privacypolicy", destination: "/privacy", permanent: true },
      { source: "/PrivacyPolicy", destination: "/privacy", permanent: true },
    ];
  },
};

export default nextConfig;
