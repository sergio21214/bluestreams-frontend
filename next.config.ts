import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  allowedDevOrigins: [
    "192.168.1.6",
    "192.168.1.7",
    "192.168.1.8",
    "100.121.56.9",
    "www.bluestreams.uk"
  ]
};

export default nextConfig;
