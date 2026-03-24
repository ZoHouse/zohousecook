//@ts-check

// Local dev: bypass Nx wrapper (requires Nx daemon which may not be running)
// Production builds use: composePlugins(withNx)(nextConfig) via CI/CD
const USE_NX = process.env.USE_NX === "true";

if (USE_NX) {
  console.log("[INFO] Using Nx-wrapped config");
}

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] App ID: ${process.env.APP_ID}`);
console.log(`[INFO] Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Next Base Path: ${process.env.NEXT_BASE_PATH}`);
console.log(`[INFO] Next Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Next Public API URL: ${process.env.NEXT_PUBLIC_API_URL}`);

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  basePath: process.env.NEXT_BASE_PATH || "",
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://static.cdn.zo.xyz' : '',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.zo.xyz",
      },
      {
        protocol: "https",
        hostname: "static.cdn.zo.xyz",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  env: {
    APP_ID: process.env.APP_ID || "",
    API_BASE_URL: process.env.API_BASE_URL || "",
    API_SOCKET_URL: process.env.API_SOCKET_URL || "",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://zo.xyz/ops-backend",
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
  },
  transpilePackages: [
    "@mui/material",
    "@mui/icons-material",
    "@mui/lab",
    "@mui/x-date-pickers",
    "@emotion/react",
    "@emotion/styled",
    "mapbox-gl",
    "@mapbox/mapbox-gl-geocoder",
    "recharts",
    "@react-pdf/renderer",
    "@slack/web-api",
  ],
};

if (USE_NX) {
  const { composePlugins, withNx } = require("@nx/next");
  module.exports = composePlugins(withNx)(nextConfig);
} else {
  module.exports = nextConfig;
}
