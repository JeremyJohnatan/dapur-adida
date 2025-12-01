import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com", // Izinkan Google Redirect
      },
      {
        protocol: "https",
        hostname: "asset.kompas.com", // Sering dipakai kompas
      },
      {
        protocol: "https",
        hostname: "**", 
      },
    ],
  },
};

export default nextConfig;