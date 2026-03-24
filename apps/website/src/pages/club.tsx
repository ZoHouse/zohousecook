import React from "react";
import { MetaTags, Page } from "../components/common";
import {
  ClubHero,
  FounderMode,
  FounderDirectory,
  Leaderboard,
  ClubCTA,
} from "../components/helpers/club";
import {
  Communities,
  CulturalProtocol,
  Events,
  Nodes,
  Partners,
} from "../components/helpers/membership";
import { membershipPageData } from "../config";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { InferGetServerSidePropsType } from "next";
import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Club: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <Page className="bg-black !max-w-none !px-0 !pt-0 snap-y snap-mandatory scroll-smooth">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <ClubHero />
      <FounderMode />
      <Communities communities={membershipPageData.communities} />
      <Nodes nodes={membershipPageData.nodes} />
      <Events events={membershipPageData.events} />
      <Partners partners={membershipPageData.partners} />
      <CulturalProtocol />
      <FounderDirectory />
      <Leaderboard />
      <ClubCTA />
    </Page>
  );
};

export default Club;
