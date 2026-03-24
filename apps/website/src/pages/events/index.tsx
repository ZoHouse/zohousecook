import React from "react";
import "react-spring-bottom-sheet/dist/style.css";
import { MetaTags } from "../../components/common";

import { HeroSection } from "../../components/helpers/events";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { InferGetServerSidePropsType } from "next";
import { fetchMetaData as getServerSideProps } from "../../components/utils";
export { getServerSideProps };

const index: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <div className="w-full h-screen bg-zui-dark">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />{" "}
      <HeroSection />
    </div>
  );
};

export default index;
