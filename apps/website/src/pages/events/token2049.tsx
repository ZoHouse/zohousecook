import {
  HeroSection,
  MintYourPoaSection,
  SingaporePageFooter,
} from "../../components/helpers/singapore-event-map";

import "react-spring-bottom-sheet/dist/style.css";

import { InferGetServerSidePropsType } from "next";
import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { MetaTags } from "../../components/common";
import { fetchMetaData as getServerSideProps } from "../../components/utils";
export { getServerSideProps };

const Events: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <div className="w-full h-screen bg-zui-dark">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <HeroSection />
      <MintYourPoaSection />
      <SingaporePageFooter />
    </div>
  );
};

export default Events;
