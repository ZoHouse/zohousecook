import { Html, Head, Main, NextScript } from "next/document";

const FAVICON_URL =
  "https://cdn.zo.xyz/gallery/media/images/96402471-9ce9-40f4-9530-e6f36a0beb65_20260414182119.svg";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const MOENGAGE_APP_ID = process.env.NEXT_PUBLIC_MOENGAGE_APP_ID;
const MOENGAGE_DC = process.env.NEXT_PUBLIC_MOENGAGE_DATA_CENTER || "dc1";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href={FAVICON_URL} type="image/svg+xml" />
        <link rel="shortcut icon" href={FAVICON_URL} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={FAVICON_URL} />
        <meta name="theme-color" content="#d4af37" />

        {/* Consent Mode v2 default — must come BEFORE GA4 + Pixel.
           The `function gtag(){...}` declaration becomes window.gtag (script
           tags share global scope), and the GA4 block below uses
           `window.gtag = window.gtag || ...` which short-circuits to preserve
           THIS function. Result: every consent.ts wrapper call also flows
           through the same gtag, so dataLayer entries are consistent. */}
        {(GA4_ID || META_PIXEL_ID) && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent','default',{
  ad_storage:'granted',
  analytics_storage:'granted',
  ad_user_data:'granted',
  ad_personalization:'granted',
  wait_for_update:500
});
              `.trim(),
            }}
          />
        )}

        {/* GA4 */}
        {GA4_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
gtag('js', new Date());
gtag('config', '${GA4_ID}', { send_page_view: false });
                `.trim(),
              }}
            />
          </>
        )}

        {/* Meta Pixel base */}
        {META_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
              `.trim(),
            }}
          />
        )}

        {/* MoEngage Web SDK */}
        {MOENGAGE_APP_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function(i,s,o,g,r,a,m,n){i.moengage_object=r;t={};q=function(f){return function(){
(i.moengage_q=i.moengage_q||[]).push({f:f,a:arguments})}};f=['track_event','add_user_attribute',
'add_first_name','add_last_name','add_email','add_mobile','add_user_name','add_gender',
'add_birthday','destroy_session','add_unique_user_id','update_unique_user_id','moe_events',
'call_web_push','track','location_type_attribute'];h={onsite:["getData","registerCallback"]};
for(k in f){t[f[k]]=q(f[k])}for(k in h)for(l in h[k]){null==t[k]&&(t[k]={}),t[k][h[k][l]]=q(k+"."+h[k][l])}
a=s.createElement(o);m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);
i.moe=i.moe||function(){n=arguments[0];return t};i[r]=t})(window,document,'script',
'https://cdn.moengage.com/webpush/moe_webSdk.min.latest.js','Moengage');
Moengage = moe({app_id: '${MOENGAGE_APP_ID}', debug_logs: 0, cluster: '${MOENGAGE_DC}'});
              `.trim(),
            }}
          />
        )}
      </Head>
      <body style={{ background: "#000" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
