import { InferGetServerSidePropsType } from "next";
import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";
import React from "react";
import { MetaTags, Page } from "../components/common";
import {
  Brands,
  EventCard,
  FounderMemberCard,
  HeroSection,
  NewsSection,
  TweetsSection,
  ZoBrandsSection,
} from "../components/helpers/home";
import { Nodes } from "../components/helpers/membership";
import { homepageData, membershipPageData } from "../config";

import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Index: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <Page className="relative">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <HeroSection />
      <NewsSection news={homepageData.newsSection.data} />
      <Nodes title="Zo Zo Zo" subtitle="If you Zo you Zo" nodes={[]} />
      <ZoBrandsSection />
      {/* <Nodes title="Vibes" subtitle="" nodes={[
        { ...membershipPageData.nodes[1], text: "People" },
        { ...membershipPageData.nodes[0], text: "Parties" },
        { ...membershipPageData.nodes[2], text: "Places" },
      ]} /> */}
      {/* <FounderMemberCard /> */}
      <TweetsSection />
      <Brands brands={homepageData.brands.data} />
    </Page>
  );
};

export default Index;
