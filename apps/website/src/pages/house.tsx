import { InferGetServerSidePropsType } from "next";
import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";
import React from "react";
import { MetaTags } from "../components/common";
import {
  ApplyCTA,
  FounderStack,
  HouseHero,
  HouseStats,
  Program,
  Properties,
  WhatIsZoHouses,
} from "../components/helpers/house";
import ZoClub from "../components/helpers/club/ZoClub";

import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const House: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <div className="relative">
      <MetaTags
        title={metaData?.title || "Zo Houses — Where Founders Build, Ship, and Raise"}
        description={
          metaData?.description ||
          "A founder culture house in Bangalore. 12-week residency program across two houses. Apply for Cohort 1."
        }
        image={metaData?.image}
      />

      {/* Hero — full bleed, no Page wrapper */}
      <HouseHero />

      {/* Stats */}
      <div className="mx-auto max-w-[1400px] w-full lg:px-[108px] px-6">
        <HouseStats />

        {/* What is Zo Houses */}
        <WhatIsZoHouses />

        {/* Properties */}
        <Properties />

        {/* 12-Week Program */}
        <Program />

        {/* The Stack */}
        <FounderStack />

        {/* Zo Club App */}
        <ZoClub className="mt-20 md:mt-[120px] rounded-3xl inner-border" />

        {/* Apply CTA */}
        <ApplyCTA />
      </div>
    </div>
  );
};

export default House;
