import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The floating dev-tools badge sits bottom-left where the map's layers
  // button now lives.
  devIndicators: false,
};

export default nextConfig;
