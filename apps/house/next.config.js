//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] App ID: ${process.env.APP_ID}`);
console.log(`[INFO] Web Base URL: ${process.env.WEB_BASE_URL || "https://zo.house"}`);

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
const nextConfig = {
  nx: { svgr: false },
  images: {
    domains: [
      "cdn.zo.xyz",
      "proxy.cdn.zo.xyz",
      "static.cdn.zo.xyz",
      "proxy.cdn.zostel.com",
      "cdn.zostel.com",
      "unavatar.io",
      "avatars.githubusercontent.com",
    ],
  },
  env: {
    APP_ID: process.env.APP_ID || "",
    API_BASE_URL: process.env.API_BASE_URL || "",
    API_SOCKET_URL: process.env.API_SOCKET_URL || "",
    MEDIA_BASE_URL: process.env.MEDIA_BASE_URL || "https://cdn.zo.xyz",
    WEB_BASE_URL: process.env.WEB_BASE_URL || "https://zo.house",
    NEXT_PUBLIC_ZO_CLIENT_KEY_WEB:
      process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB || "",
  },
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
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
