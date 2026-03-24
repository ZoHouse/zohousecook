import { InferGetServerSidePropsType } from "next";
import { MetaTags, Page } from "../components/common";
import { IntroSection } from "../components/helpers/membership";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Membership: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <Page className="bg-black lg:pt-0 snap-y snap-mandatory scroll-smooth">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <IntroSection />
    </Page>
  );
};
export default Membership;
