//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] App ID: ${process.env.APP_ID}`);
console.log(`[INFO] Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Next Base Path: ${process.env.NEXT_BASE_PATH}`);
console.log(`[INFO] Next Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Web Base URL: ${process.env.WEB_BASE_URL}`);
console.log(
  `[INFO] NFT Airdrop slug: ${process.env.NFT_AIRDROP_COLLECTION_SLUG}`
);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  basePath: process.env.NEXT_BASE_PATH || "",
  assetPrefix: process.env.NEXT_ASSET_PREFIX || "",
  images: {
    domains: [
      "static.cdn.zo.xyz",
      "proxy.cdn.zo.xyz",
      "images.pexels.com",
      "s3-alpha-sig.figma.com",
      "cdn.zo.xyz",
      "zoworld-nsfp.s3.amazonaws.com",
    ],
  },
  env: {
    APP_ID: process.env.APP_ID || "",
    API_BASE_URL: process.env.API_BASE_URL || "",
    API_SOCKET_URL: process.env.API_SOCKET_URL || "",
    WEB_BASE_URL: process.env.WEB_BASE_URL || "https://zo.xyz",
    NFT_AIRDROP_COLLECTION_SLUG: process.env.NFT_AIRDROP_COLLECTION_SLUG || "",
    SINGAPORE_EVENT_POA_ID: process.env.SINGAPORE_EVENT_POA_ID || "",
    SINGAPORE_OPERATOR_PID: process.env.SINGAPORE_OPERATOR_PID || "",
    ZOHOUSE_SFO_PID: process.env.ZOHOUSE_SFO_PID || "",
    CRYPTO_EVENT_PID: process.env.CRYPTO_EVENT_PID || "",
    MEDIA_BASE_URL: process.env.MEDIA_BASE_URL || "",
  },
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/dashboard/:path*",
          destination: "http://localhost:4203/dashboard/:path*",
        },
        {
          source: "/dashboard",
          destination: "http://localhost:4203/dashboard",
        },
      ];
    }
    return [];
  },
  transpilePackages: [
    "gsap",
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
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
