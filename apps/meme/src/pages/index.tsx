/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Footer, MetaTags } from "../components/common";
import {
  Brands,
  DetailSection,
  HeroSection,
  MemeShowcase,
  ResearchSection,
  ShareYourMeme,
  Tokenomics,
} from "../components/helpers";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { InferGetServerSidePropsType } from "next";
import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Index: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />

      {/* TV Frame */}
      <img
        src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/tv-frame.png"
        className="fixed top-0 left-0 z-30 w-screen h-full pointer-events-none"
        alt="TV Frame"
      />

      <div className="w-full h-screen overflow-x-hidden relative z-20 py-10 xl:py-14 2xl:py-20">
        <HeroSection />
        <DetailSection />
        <ResearchSection />
        <Brands />
        <Tokenomics />
        <MemeShowcase />
        <ShareYourMeme />
        <Footer />
      </div>

      <video
        autoPlay
        playsInline
        loop
        muted
        className="fixed top-0 left-0 -z-0 w-full h-full pointer-events-none object-cover"
      >
        <source
          src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/artifacts-background.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default Index;
