//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] App ID: ${process.env.APP_ID}`);
console.log(`[INFO] Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Next Base Path: ${process.env.NEXT_BASE_PATH}`);
console.log(`[INFO] Next Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Web Base URL: ${process.env.WEB_BASE_URL}`);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  basePath: process.env.NEXT_BASE_PATH || "",
  assetPrefix: process.env.NEXT_ASSET_PREFIX || "",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.zo.xyz",
      },
      {
        protocol: "https",
        hostname: "zoworld-nsfp.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "nft-cdn.zo.xyz",
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
    WEB_BASE_URL: process.env.WEB_BASE_URL || "https://zo.xyz",
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
