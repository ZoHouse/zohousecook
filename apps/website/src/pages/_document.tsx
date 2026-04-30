import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";
import React from "react";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Zo World" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script
          id="gtm"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PWPM6Z8');`,
          }}
        />
        {/* Pre-paint owner detection for /@handle routes. Mirrors the
            readOwnerHint() schema in pages/passport.tsx — keep in sync.
            Runs before body paints, sets html.passport-is-owner when the
            viewer's cached handle matches the URL, so the SSR Public view
            is hidden by the CSS below until React mounts the Owner lobby.
            Non-owners and logged-out visitors: class is never added, SSR
            Public view paints normally. No flash on either path. */}
        <Script
          id="passport-owner-hint"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=location.pathname.match(/^\\/@([^/?#]+)/);if(!m)return;var urlHandle=decodeURIComponent(m[1]);var ls=window.localStorage;var rawAu=ls.getItem("zo-admin-user")||ls.getItem("zo-web-user");if(!rawAu)return;var au=JSON.parse(rawAu);if(!au)return;var hint=null;var rawRec=ls.getItem("zo-passport-owner-hint");if(rawRec){var r=JSON.parse(rawRec);var match=(r.authUserId&&au.id&&r.authUserId===au.id)||(r.mobileNumber&&au.mobile_number&&r.mobileNumber===au.mobile_number)||(r.emailAddress&&au.email_address&&r.emailAddress===au.email_address);if(match&&r.handle)hint=String(r.handle).replace(/\\.zo$/,"").trim();}if(!hint){var fb=au.custom_nickname||au.nickname;if(fb)hint=String(fb).replace(/\\.zo$/,"").trim();}if(hint&&hint===urlHandle)document.documentElement.classList.add("passport-is-owner");}catch(e){}})();`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `html.passport-is-owner [data-passport-ssr="public"]{display:none!important}`,
          }}
        />
      </Head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PWPM6Z8"
            height="0"
            width="0"
            style={{
              display: "none",
              visibility: "hidden",
            }}
          ></iframe>
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
