//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");
const { withSentryConfig } = require("@sentry/nextjs");

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] App ID: ${process.env.APP_ID}`);
console.log(`[INFO] Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Next Base Path: ${process.env.NEXT_BASE_PATH}`);
console.log(`[INFO] Next Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Web Base URL: ${process.env.WEB_BASE_URL}`);
console.log(`[INFO] API Base URL Zostel: ${process.env.API_BASE_URL_ZOSTEL}`);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  transpilePackages: [
    "antd",
    "rc-util",
    "@babel/runtime",
    "@ant-design/icons",
    "@ant-design/icons-svg",
    "rc-pagination",
    "rc-picker",
    "rc-tree",
    "rc-input",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
    "rc-table",
  ],
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
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
    API_BASE_URL_ZOSTEL: process.env.API_BASE_URL_ZOSTEL || "",
    WEB_BASE_URL: process.env.WEB_BASE_URL || "https://zo.xyz",
    ZOSTEL_BASE_WEB_URL: process.env.ZOSTEL_BASE_WEB_URL || "",
    ZOSTEL_ADMIN_URL: process.env.ZOSTEL_ADMIN_URL || "",
    ZOSTEL_APP_ID: process.env.ZOSTEL_APP_ID || "",
    TRIP_OPERATOR_ID: process.env.TRIP_OPERATOR_ID || "",
    POA_CONTRACT_ID: process.env.POA_CONTRACT_ID || "",
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

const sentryWebpackPluginOptions = {
  org: "zo-world",
  project: "mono-front",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
};

module.exports = withSentryConfig(
  composePlugins(...plugins)(nextConfig),
  sentryWebpackPluginOptions
);
