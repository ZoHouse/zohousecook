//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] App ID: ${process.env.APP_ID}`);
console.log(`[INFO] Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Next Base Path: ${process.env.NEXT_BASE_PATH}`);
console.log(`[INFO] Next Asset Prefix: ${process.env.NEXT_ASSET_PREFIX}`);
console.log(`[INFO] Relation Type: ${process.env.MEME_RELATION_TYPE}`);
console.log(`[INFO] Relation ID: ${process.env.MEME_RELATION_ID}`);
console.log(`[INFO] Web Base URL: ${process.env.WEB_BASE_URL}`);
console.log(`[INFO] Web Base Path: ${process.env.WEB_BASE_PATH}`);

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
    MEME_RELATION_TYPE: process.env.MEME_RELATION_TYPE || "",
    MEME_RELATION_ID: process.env.MEME_RELATION_ID || "",
    WEB_BASE_URL: process.env.WEB_BASE_URL || "https://zo.xyz",
    WEB_BASE_PATH: process.env.WEB_BASE_PATH || "",
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
