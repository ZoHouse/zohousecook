import { InferGetServerSidePropsType } from "next";
import { MetaTags, Page } from "../components/common";
import {
  Benefits,
  Mint321,
  MintToken1111,
} from "../components/helpers/membership";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Mint: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <Page>
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <h1 className="zui-heading-1">Become a Founder Member</h1>
      <Mint321 />
      <Benefits />
      <MintToken1111 />
    </Page>
  );
};
export default Mint;
