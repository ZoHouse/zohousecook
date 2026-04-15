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
    ZOSTEL_APP_ID: process.env.ZOSTEL_APP_ID || "",
    API_BASE_URL_ZOSTEL: process.env.API_BASE_URL_ZOSTEL || "",
  },
  async redirects() {
    // /house and /house/* moved out of the website app to the standalone
    // apps/house marketing app at zo.house. The old /house route served a
    // stubbed apply form that never saved to any backend. Permanently
    // redirect both zozozo.work/house and zo.xyz/house traffic to the
    // live standalone app.
    return [
      {
        source: "/house",
        destination: "https://zo.house",
        permanent: true,
        basePath: false,
      },
      {
        source: "/house/:path*",
        destination: "https://zo.house/:path*",
        permanent: true,
        basePath: false,
      },
    ];
  },
  async rewrites() {
    // Sub-app routing: proxy path-based routes to their respective Vercel deployments
    // In development, proxy to local ports. In production/staging, proxy to Vercel URLs.
    const isDev = process.env.NODE_ENV === "development";

    const subApps = [
      { path: "pm", devPort: 4204, vercelUrl: process.env.REWRITE_PMS_URL || "https://zozozo-pm-samurais-dojo.vercel.app" },
      { path: "dashboard", devPort: 4203, vercelUrl: process.env.REWRITE_DASHBOARD_URL || "https://zozozo-dashboard-samurais-dojo.vercel.app" },
      { path: "admin", devPort: 4201, vercelUrl: process.env.REWRITE_ADMIN_URL || "https://zozozo-admin-samurais-dojo.vercel.app" },
      { path: "ops", devPort: 4210, vercelUrl: process.env.REWRITE_OPS_URL || "https://zozozo-ops-samurais-dojo.vercel.app" },
      { path: "checkin", devPort: 4206, vercelUrl: process.env.REWRITE_CHECKIN_URL || "https://zozozo-checkin-samurais-dojo.vercel.app" },
      { path: "payments", devPort: 4205, vercelUrl: process.env.REWRITE_PAYMENTS_URL || "https://zozozo-payments-samurais-dojo.vercel.app" },
      { path: "comic", devPort: 4209, vercelUrl: process.env.REWRITE_COMIC_URL || "https://zozozo-comic-samurais-dojo.vercel.app" },
      { path: "meme", devPort: 4208, vercelUrl: process.env.REWRITE_MEME_URL || "https://zozozo-meme-samurais-dojo.vercel.app" },
    ];

    const rewrites = [
      { source: "/@:handle", destination: "/passport" },
    ];
    for (const app of subApps) {
      const dest = isDev
        ? `http://localhost:${app.devPort}`
        : app.vercelUrl;
      rewrites.push(
        { source: `/${app.path}`, destination: `${dest}/${app.path}` },
        { source: `/${app.path}/:path*`, destination: `${dest}/${app.path}/:path*` },
      );
    }

    return rewrites;
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
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);

