import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath || undefined,
  output: isStaticExport ? "export" : "standalone",
  trailingSlash: isStaticExport,
  poweredByHeader: false,
  images: { unoptimized: isStaticExport },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;
