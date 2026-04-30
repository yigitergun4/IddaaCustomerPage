import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/IddaaCustomerPage',
  reactCompiler: true,
};

export default nextConfig;
