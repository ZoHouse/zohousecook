import { isClient } from "@zo/utils/next";
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
const TITLE = "Unicorn from SF";
const DESCRIPTION =
  "Silicon Valley’s newest invention, a $20b retarded space faring Unicorn. ";
const IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/96a27bac-89ed-4808-be62-71f0a8dac8ba_20240806094357.gif";

const SITE_NAME = "Unicorn from SF";

const MetaTags: React.FC<MetaTagsProps> = ({
  title = TITLE,
  description,
  image,
  canonical,
  type = "website",
}) => {
  const router = useRouter();

  const url = useMemo(
    () =>
      isClient
        ? `${window.location.origin}${router.pathname}`
        : `https://unicornsf.com${router.pathname}`,
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
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title || TITLE} />
      <meta
        property="twitter:description"
        content={description || DESCRIPTION}
      />
      <meta property="twitter:image" content={image || IMAGE} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Head>
  );
};

export default MetaTags;
