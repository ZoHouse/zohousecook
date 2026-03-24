import { InferGetServerSidePropsType } from "next";
import { MetaTags, Page } from "../components/common";
import {
  Communities,
  CulturalProtocol,
  Events,
  FounderMemberList,
  IntroSection,
  Nodes,
  Partners,
  StartYourZoNode,
  VibeNetwork,
} from "../components/helpers/membership";
import { membershipPageData } from "../config";

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
      <VibeNetwork />
      <FounderMemberList />
      <Communities communities={membershipPageData.communities} />
      <Nodes nodes={membershipPageData.nodes} />
      <Events events={membershipPageData.events} />
      <Partners partners={membershipPageData.partners} />
      <CulturalProtocol />
      <StartYourZoNode steps={membershipPageData.steps} />
    </Page>
  );
};
export default Membership;
