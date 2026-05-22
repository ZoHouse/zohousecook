import Head from "next/head";
import { useRouter } from "next/router";
import React, { useMemo } from "react";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: string;
}

const TITLE = "Zo House · India's first permanent hacker house";
const DESCRIPTION =
  "Two nodes in Bangalore. 35 slots. Founders live, build, and compound here. Apply for the waitlist.";
const IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/d5a42fe5-cd0c-4e04-98fd-539a8b2b5369_20260414235233.jpg";

export const MetaTags: React.FC<MetaTagsProps> = ({
  title = TITLE,
  description,
  image,
  canonical,
  type = "website",
}) => {
  const router = useRouter();
  const url = useMemo(
    () =>
      typeof window !== "undefined"
        ? `${window.location.origin}${router.pathname}`
        : `https://zo.house${router.pathname}`,
    [router.pathname]
  );

  return (
    <Head>
      <title>{title || TITLE}</title>
      <meta name="title" content={title || TITLE} />
      <meta name="description" content={description || DESCRIPTION} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title || TITLE} />
      <meta property="og:description" content={description || DESCRIPTION} />
      <meta property="og:image" content={image || IMAGE} />
      <meta property="og:image:secure_url" content={image || IMAGE} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="665" />
      <meta property="og:image:alt" content="Zo House. India's first permanent hacker house" />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title || TITLE} />
      <meta property="twitter:description" content={description || DESCRIPTION} />
      <meta property="twitter:image" content={image || IMAGE} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Head>
  );
};

export default MetaTags;
