import Icon from "@zo/assets/icons";
import { useAuth, useMutationApi, useProfile } from "@zo/auth";
import { formatAddress } from "@zo/utils/web3";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import zomusicVideo from "../assets/videos/zomusic.mp4";

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
    if (isLoggedIn) {
      createInquiry(
        { data: { subject: "SHOWN_INTEREST_IN_MUSIC" }, route: "music/" },
        { onSuccess: console.log.bind(null, "Lead Generated") }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative w-screen h-screen bg-black max-w-full overflow-hidden"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scale(1.15)" }}
        src={zomusicVideo}
      />
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

      {/* Wallet toggle — top right */}
      <div className="absolute z-20 top-4 right-4">
        <button
          onClick={() => {
            if (!profile.profile?.wallet_address) showLoginModal(["wallet"]);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/80 transition-all"
          style={{
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Icon name="Ethereum" size={14} />
          {profile.profile?.wallet_address
            ? formatAddress(profile.profile.wallet_address)
            : "Connect Wallet"}
        </button>
      </div>

      {/* Radio pill + status — center bottom */}
      <div className="z-20 absolute left-[50%] bottom-[300px] -translate-x-[50%] flex flex-col items-center gap-3">
        <button
          onClick={!tunedIn ? handleTuneIn : undefined}
          className="w-[320px] md:w-[380px] flex items-center gap-3 px-5 py-3 rounded-2xl text-white transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.15)",
            cursor: tunedIn ? "default" : "pointer",
          }}
        >
          {/* Pulsing dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {tunedIn && isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            )}
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{
                background: tunedIn && isPlaying ? "#a78bfa" : "rgba(255,255,255,0.3)",
              }}
            />
          </span>

          <div className="flex flex-col items-start min-w-0 flex-1">
            {!tunedIn ? (
              <span className="text-xs tracking-widest uppercase opacity-60">
                Tune into ZO FM 86.13
              </span>
            ) : isPlaying && currentSong ? (
              <>
                <span className="text-sm truncate w-full font-medium" style={{ color: "#e2e8f0" }}>
                  {currentSong.title}
                </span>
                <span className="text-xs opacity-40 truncate w-full">
                  {currentSong.artist} &middot; {slot?.name}
                </span>
              </>
            ) : (
              <span className="text-xs opacity-50">Tuning in...</span>
            )}
          </div>

          <span
            className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: tunedIn && isPlaying ? "#a78bfa" : "rgba(255,255,255,0.35)",
            }}
          >
            86.13
          </span>
        </button>

        {profile.profile?.wallet_address && (
          <span className="text-xs text-white/50 tracking-wide">
            You are Tuned into Zo
          </span>
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
