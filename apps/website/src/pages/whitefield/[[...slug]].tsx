/* eslint-disable jsx-a11y/alt-text */
import { sendGTMEvent } from "@next/third-parties/google";
import { fontClassName } from "@zo/utils/font";
import { useScrollToHash, useWindowSize } from "@zo/utils/hooks";
import { InferGetServerSidePropsType } from "next";
import { useEffect, useState } from "react";
import { MetaTags, Page } from "../../components/common";
import {
  ConnectSection,
  FAQsSection,
  FeaturesSection,
  GallerySection,
  GetYourMembership,
  IntroSection,
  LocationSection,
  ViewBrochureModal,
  ZoHouseSection,
} from "../../components/helpers/whitefield";
import { Button } from "../../components/ui";
import { scrollToId } from "../../components/utils";
import { whiteFieldData } from "../../config";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

const Whitefield: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  useScrollToHash();

  const { isMobile } = useWindowSize();

  const [hasUserScrolled, setScrolled] = useState<boolean>(false);
  const [isBrochureModalOpen, setBrochureModalOpen] = useState<boolean>(false);

  const handleBecomeMemberClick = () => {
    sendGTMEvent({ event: "click_cta" });
    scrollToId("apply");
  };

  const handleViewBrochureClick = () => {
    sendGTMEvent({ event: "click_cta" });
    setBrochureModalOpen(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    sendGTMEvent({ event: "page_view" });
  }, []);

  return (
    <Page className={fontClassName}>
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <IntroSection />
      <GallerySection images={whiteFieldData.gallery.data} />
      <LocationSection />
      <FeaturesSection features={whiteFieldData.features.data} />
      <ConnectSection />
      <ZoHouseSection />
      <GetYourMembership />
      <FAQsSection faqs={whiteFieldData.faqs.data} />

      {isMobile && hasUserScrolled && (
        <div className="fixed bottom-6 left-[50%] -translate-x-[50%] gap-4 z-40  md:hidden flex items-center justify-center">
          <Button
            onClick={handleBecomeMemberClick}
            type="primary"
            className="px-6 whitespace-nowrap"
          >
            Become a Partner
          </Button>
          <Button
            onClick={handleViewBrochureClick}
            type="secondary"
            className="px-4 whitespace-nowrap bg-zui-dark"
          >
            View Brochure
          </Button>
        </div>
      )}
      <ViewBrochureModal
        isOpen={isBrochureModalOpen}
        onClose={setBrochureModalOpen.bind(null, false)}
      />
    </Page>
  );
};

export default Whitefield;

export const getServerSideProps = () => {
  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
};
