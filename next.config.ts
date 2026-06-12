import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/course", destination: "/courses", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
