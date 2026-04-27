//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: false,
  },
  basePath: process.env.NEXT_BASE_PATH || "",
  assetPrefix:
    process.env.NODE_ENV === "development"
      ? ""
      : process.env.NEXT_ASSET_PREFIX || "",
  env: {
    APP_ID: process.env.APP_ID || "social-engine",
  },
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
    "rc-table",
  ],
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
