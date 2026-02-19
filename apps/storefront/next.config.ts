import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ascunde indicatorul „N” din dev ca să nu se suprapună peste bottom nav; experiență mobilă ca produs live
  devIndicators: false,
  // Monorepo: rădăcina proiectului (unde e package-lock.json de la root), ca Turbopack să nu mai avertizeze despre lockfile-uri multiple
  turbopack: {
    root: path.resolve(process.cwd(), "..", ".."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
