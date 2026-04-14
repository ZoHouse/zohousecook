//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
console.log(`[INFO] Web Base URL: ${process.env.WEB_BASE_URL || "https://zo.house"}`);

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
const nextConfig = {
  nx: { svgr: false },
  images: {
    domains: [
      "cdn.zo.xyz",
      "proxy.cdn.zo.xyz",
      "static.cdn.zo.xyz",
      "unavatar.io",
      "avatars.githubusercontent.com",
    ],
  },
  env: {
    WEB_BASE_URL: process.env.WEB_BASE_URL || "https://zo.house",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
  ],
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
