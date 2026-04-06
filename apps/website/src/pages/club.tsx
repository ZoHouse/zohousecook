import React from "react";
import { MetaTags, Page } from "../components/common";
import {
  NetworkHero,
  ZoEffect,
  AlumniDirectory,
  MentorStack,
  NetworkCTA,
  ChemistryCard,
} from "../components/helpers/club";
import Events from "../components/helpers/membership/Events";
import membershipData from "../config/membership";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { InferGetServerSidePropsType } from "next";
import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Club: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <Page className="bg-black !max-w-none !px-0 !pt-0 snap-y snap-proximity scroll-smooth">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <NetworkHero />
      <ZoEffect />
      <AlumniDirectory />
      <ChemistryCard />
      <Events events={membershipData.events} />
      <MentorStack />
      <NetworkCTA />
    </Page>
  );
};

export default Club;
// deploy 1775386887
