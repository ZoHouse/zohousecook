import Icon from "@zo/assets/icons";
import { useAuth, useMutationApi, useProfile } from "@zo/auth";
import { formatAddress } from "@zo/utils/web3";
import React, { useEffect, useState } from "react";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { InferGetServerSidePropsType } from "next";
import { MetaTags } from "../components/common";
import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Music: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  const profile = useProfile();

  const { showLoginModal, isLoggedIn } = useAuth();

  const [backgroundImage, setBackgroundImage] = useState("");

  const { mutate: createInquiry } = useMutationApi("LEADS_INQUIRIES");

  useEffect(() => {
    const handleResize = () => {
      setBackgroundImage(
        `url(${
          window.innerWidth < 768
            ? "https://static.cdn.zo.xyz/web-media/bg-music-mobile.jpeg"
            : "https://static.cdn.zo.xyz/web-media/bg-music.jpg"
        })`
      );
    };

    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      createInquiry(
        { data: { subject: "SHOWN_INTEREST_IN_$MUSIC" }, route: "music/" },
        { onSuccess: console.log.bind(null, "Lead Generated") }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative w-screen h-screen bg-red-100 bg-center bg-no-repeat bg-cover max-w-full"
      style={{
        backgroundImage: backgroundImage,
      }}
    >
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <div className="z-20 absolute left-[50%] bottom-[180px] -translate-x-[50%]">
        <div className="bg-white w-[350px] md:w-[430px] h-[60px] border-b border-zui-dark flex items-center gap-4 text-zui-dark font-bold px-4 md:px-6 py-4 text-lg">
          <Icon name="Ethereum" size={24} />
          {profile.profile?.wallet_address ? (
            formatAddress(profile.profile.wallet_address)
          ) : (
            <button
              onClick={() => {
                showLoginModal(["wallet"]);
              }}
            >
              Connect your Wallet to tune in
            </button>
          )}
        </div>
        {/* <div className="bg-white w-[350px] md:w-[430px] h-[60px] border-b border-zui-dark flex items-center gap-4 text-zui-dark font-bold px-4 md:px-6 py-4 text-lg">
          <Icon name="X" size={24} />
          Connect X to share your vibes
        </div> */}
        {profile.profile?.wallet_address && (
          <div className="bg-zui-green w-[350px] md:w-[430px] h-[60px] flex items-center gap-4 text-zui-dark px-4 md:px-6 py-4 text-lg">
            <span>
              Thanks for showing your interest in <strong>$MUSIC</strong>
            </span>
          </div>
        )}
      </div>
      <a
        href="https://x.com/MUSICxZo"
        target="_blank"
        className="absolute z-20 left-[50%] bottom-[50px] -translate-x-[50%]"
      >
        <Icon name="X" size={34} fill="#fff" />
      </a>
      <div className="absolute inset-0 bg-black opacity-25 z-10" />
    </div>
  );
};

export default Music;
