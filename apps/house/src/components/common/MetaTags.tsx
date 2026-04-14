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
  "https://cdn.zo.xyz/gallery/media/images/42cfd9c7-c164-4831-b178-d94242b323e7_20260414193919.png";

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
