//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/earn";

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] App ID: ${process.env.APP_ID || "earn"}`);
console.log(`[INFO] Base Path: ${basePath}`);

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
const nextConfig = {
  nx: { svgr: false },
  basePath,
  assetPrefix: basePath,
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: [
      "cdn.zo.xyz",
      "proxy.cdn.zo.xyz",
      "static.cdn.zo.xyz",
    ],
  },
  env: {
    APP_ID: process.env.APP_ID || "earn",
    DATABASE_URL: process.env.DATABASE_URL || "",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
