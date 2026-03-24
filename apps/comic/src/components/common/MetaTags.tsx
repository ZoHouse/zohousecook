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
const TITLE = "A brave new world!";
const DESCRIPTION =
  "A place to vibe in every corner of the world. A local friend, everywhere. Connect from anywhere. Welcome to Zo World!";
const IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/c4a6a760-f7c4-4627-bd82-05ac00fb16d6_20240917082703.jpg";

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
        : `https://zo.xyz${router.pathname}`,
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
