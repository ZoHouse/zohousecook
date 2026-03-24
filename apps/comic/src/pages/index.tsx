import dynamic from "next/dynamic";
import { MetaTags } from "../components/common";

const PdfViewer = dynamic(() => import("../components/ui/PdfViewer"), {
  ssr: false,
});
import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";
import { fetchMetaData as getServerSideProps } from "../components/utils";
import { InferGetServerSidePropsType } from "next";
export { getServerSideProps };

const Index: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {

  return (
    <div className="w-full py-6 md:py-10">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />

      <PdfViewer pdf="https://cdn.zo.xyz/gallery/media/documents/Quantum+Surfing+-+The+First+Zo+Trip.pdf" />
    </div>
  );
};

export default Index;
