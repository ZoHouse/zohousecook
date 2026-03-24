import Icon from "@zo/assets/icons";
import { useAuth, useMutationApi, useProfile } from "@zo/auth";
import { formatAddress } from "@zo/utils/web3";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { InferGetServerSidePropsType } from "next";
import { MetaTags } from "../components/common";
import { fetchMetaData as getServerSideProps } from "../components/utils";
import { useRadioSync } from "../hooks/useRadioSync";
export { getServerSideProps };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YouTube = dynamic(() => import("react-youtube").then((mod) => mod.default) as any, {
  ssr: false,
}) as any;

const Music: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  const profile = useProfile();

  const { showLoginModal, isLoggedIn } = useAuth();

  const [backgroundImage, setBackgroundImage] = useState("");

  const { mutate: createInquiry } = useMutationApi("LEADS_INQUIRIES");

  const {
    status,
    currentSong,
    slot,
    tuneIn,
    onPlayerReady,
    onPlayerEnd,
  } = useRadioSync();

  const [tunedIn, setTunedIn] = useState(false);

  const handleTuneIn = useCallback(() => {
    setTunedIn(true);
    tuneIn();
  }, [tuneIn]);

  const isPlaying = status === "playing" || status === "dj-speaking";

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

      {/* Hidden YouTube player for audio */}
      <div className="fixed w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
        <YouTube
          opts={{
            height: "1",
            width: "1",
            playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1 },
          }}
          onReady={onPlayerReady}
          onEnd={onPlayerEnd}
          onError={() => {}}
        />
      </div>

      <div className="z-20 absolute left-[50%] bottom-[180px] -translate-x-[50%]">
        {/* ZO FM Radio Pill */}
        <button
          onClick={!tunedIn ? handleTuneIn : undefined}
          className="w-[350px] md:w-[430px] h-[60px] mb-0 flex items-center gap-3 px-4 md:px-6 py-4 text-lg font-bold border-b transition-all duration-300"
          style={{
            background: tunedIn && isPlaying
              ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
              : "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            borderColor: tunedIn && isPlaying ? "#a78bfa" : "rgba(255,255,255,0.15)",
            cursor: tunedIn ? "default" : "pointer",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Pulsing dot */}
          <span
            className="relative flex h-3 w-3 shrink-0"
          >
            {tunedIn && isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            )}
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{
                background: tunedIn && isPlaying ? "#a78bfa" : "rgba(255,255,255,0.3)",
              }}
            />
          </span>

          <div className="flex flex-col items-start min-w-0 flex-1">
            {!tunedIn ? (
              <span className="text-sm tracking-widest uppercase opacity-60">
                Tune into ZO FM 86.13
              </span>
            ) : isPlaying && currentSong ? (
              <>
                <span className="text-sm truncate w-full" style={{ color: "#e2e8f0" }}>
                  {currentSong.title}
                </span>
                <span className="text-xs opacity-40 truncate w-full">
                  {currentSong.artist} &middot; {slot?.name}
                </span>
              </>
            ) : (
              <span className="text-sm opacity-50">Tuning in...</span>
            )}
          </div>

          {/* Frequency badge */}
          <span
            className="text-xs font-mono shrink-0 px-2 py-1 rounded"
            style={{
              background: tunedIn && isPlaying ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.08)",
              color: tunedIn && isPlaying ? "#a78bfa" : "rgba(255,255,255,0.35)",
            }}
          >
            86.13
          </span>
        </button>

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
