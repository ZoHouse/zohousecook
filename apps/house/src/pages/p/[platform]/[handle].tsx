import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  VirtualTicket,
  parseHandleFromSocials,
  pickTitle,
} from "../../../components/VirtualTicket";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://elvaqxadfewcsohrswsi.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PUBLIC_BASE = process.env.WEB_BASE_URL || "https://zo.house";

interface SharePageProps {
  name: string;
  slug: string;
  socials: string;
  ticketNo: string;
  ogUrl: string;
  pageUrl: string;
}

const VALID_PLATFORMS = new Set(["x", "l", "g", "i", "y", "u"]);

// Reconstruct a synthetic socials string from the slug so the existing
// avatar resolver in VirtualTicket can pick the right unavatar.io provider.
function socialsFromSlug(platform: string, handle: string): string {
  switch (platform) {
    case "x":
      return `x.com/${handle}`;
    case "g":
      return `github.com/${handle}`;
    case "i":
      return `instagram.com/${handle}`;
    case "y":
      return `youtube.com/@${handle}`;
    case "l":
      return `linkedin.com/in/${handle}`;
    default:
      return "";
  }
}

export const getServerSideProps: GetServerSideProps<SharePageProps> = async (
  ctx
) => {
  const platformParam = String(ctx.params?.platform || "").toLowerCase();
  const handleParam = String(ctx.params?.handle || "");

  if (!VALID_PLATFORMS.has(platformParam) || !handleParam) {
    return { notFound: true };
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return { notFound: true };
  }

  const slug = `${platformParam}/${handleParam}`;
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: lead, error } = await client
    .from("pipeline_leads")
    .select("full_name, share_slug, created_at")
    .eq("share_slug", slug)
    .maybeSingle();

  if (error || !lead) {
    return { notFound: true };
  }

  // Waitlist position — same calculation as the apply API.
  let waitlistNumber = 0;
  if (lead.created_at) {
    const { count } = await client
      .from("pipeline_leads")
      .select("*", { count: "exact", head: true })
      .eq("source", "zo.house")
      .lte("created_at", lead.created_at);
    if (typeof count === "number") waitlistNumber = count;
  }

  ctx.res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=86400"
  );

  const socials = socialsFromSlug(platformParam, handleParam);
  const ticketNo =
    waitlistNumber > 0
      ? String(waitlistNumber).padStart(6, "0")
      : "000000";
  const pageUrl = `${PUBLIC_BASE}/p/${slug}`;
  const ogUrl = `${PUBLIC_BASE}/api/og/${slug}`;

  return {
    props: {
      name: lead.full_name || "Zo Citizen",
      slug,
      socials,
      ticketNo,
      ogUrl,
      pageUrl,
    },
  };
};

export default function SharePage({
  name,
  slug,
  socials,
  ticketNo,
  ogUrl,
  pageUrl,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const handle = parseHandleFromSocials(socials, name);
  const title = pickTitle(name + handle);
  const headTitle = `${name} · Zo House Waitlist`;
  const description = `${name} is on the Zo House waitlist · № ${ticketNo}.`;

  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="title" content={headTitle} />
        <meta name="description" content={description} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={headTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogUrl} />
        <meta property="og:image:secure_url" content={ogUrl} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${name}'s Zo House waitlist pass`} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={pageUrl} />
        <meta property="twitter:title" content={headTitle} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={ogUrl} />
        <link rel="canonical" href={pageUrl} />
      </Head>

      <main
        className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center px-4 py-16"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#d4af37] mb-3">
          Zo House · Waitlist
        </p>
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-2 text-center">
          {name} has been{" "}
          <span className="italic" style={{ color: "#D4AF37" }}>
            seen.
          </span>
        </h1>
        <p className="text-neutral-500 text-xs md:text-sm mb-10">
          Self-reported handle · /p/{slug}
        </p>

        <div className="origin-top scale-[0.6] sm:scale-[0.78] md:scale-100">
          <VirtualTicket
            name={name}
            handle={handle}
            title={title}
            ticketNo={ticketNo}
            socials={socials}
            hideActions
          />
        </div>

        <Link
          href="/?apply=1"
          className="mt-12 inline-block bg-white text-black font-bold text-sm tracking-widest uppercase rounded-full px-8 py-4 hover:scale-[1.02] active:scale-95 transition-all duration-300"
        >
          Claim your slot
        </Link>
        <Link
          href="/"
          className="mt-4 text-xs text-neutral-500 hover:text-white transition-colors underline underline-offset-4"
        >
          zo.house
        </Link>
      </main>
    </>
  );
}
