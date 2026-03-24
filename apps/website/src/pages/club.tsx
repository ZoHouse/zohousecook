import React, { useEffect } from "react";
import { MetaTags, Page } from "../components/common";
import { ZoClub } from "../components/helpers/club";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { InferGetServerSidePropsType } from "next";
import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Club: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    if (isAndroid) {
      window.location.href =
        "https://play.google.com/store/apps/details?id=xyz.zo.club";
    }
    if (isIOS) {
      window.location.href =
        "https://apps.apple.com/lb/app/zo-club/id6449470618";
    }
  }, []);

  return (
    <Page>
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <ZoClub
        className="md:items-center flex-col md:flex-row md:gap-40 mb-20 md:mb-0"
        downloadLinksClassName="flex"
      />
    </Page>
  );
};

export default Club;
