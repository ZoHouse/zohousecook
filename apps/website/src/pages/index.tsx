import { InferGetServerSidePropsType } from "next";
import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";
import React, { useEffect, useState } from "react";
import { useAuth } from "@zo/auth";
import { MetaTags, Page } from "../components/common";
import {
  Brands,
  EventCard,
  FounderMemberCard,
  HeroSection,
  NewsSection,
  TweetsSection,
  WhatsNewSection,
  ZoBrandsSection,
  DiscoverZoWorld,
} from "../components/helpers/home";
import { Nodes } from "../components/helpers/membership";
import { homepageData, membershipPageData } from "../config";

import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

function FloatingPassportCTA() {
  const { showLoginModal, isLoggedIn } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] md:hidden p-4 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent">
      <button
        onClick={() =>
          isLoggedIn
            ? (window.location.href = "/passport")
            : showLoginModal(undefined, "/passport")
        }
        className="w-full py-3.5 rounded-full bg-white text-black font-semibold text-base"
      >
        Become a Citizen
      </button>
    </div>
  );
}

const Index: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <Page className="relative flex-none">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <HeroSection />
      <FloatingPassportCTA />
      <WhatsNewSection />
      {/* <NewsSection news={homepageData.newsSection.data} /> */}
      <DiscoverZoWorld />
      {/* <ZoBrandsSection /> */}
      {/* <Nodes title="Vibes" subtitle="" nodes={[
        { ...membershipPageData.nodes[1], text: "People" },
        { ...membershipPageData.nodes[0], text: "Parties" },
        { ...membershipPageData.nodes[2], text: "Places" },
      ]} /> */}
      {/* <FounderMemberCard /> */}
      {/* <TweetsSection /> */}
      <Brands brands={homepageData.brands.data} />
    </Page>
  );
};

export default Index;
