import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        hostname: "**", // OPSIONAL: Tanda bintang ganda untuk mengizinkan SEMUA domain (Hanya pakai saat development)
      },
    ],
  },
};

export default nextConfig;