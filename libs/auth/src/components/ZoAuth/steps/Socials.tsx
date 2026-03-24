/* eslint-disable @typescript-eslint/no-explicit-any */
import { isClient } from "@zo/utils/next";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";
import { ZoAuthStepProps } from "../ZoAuth";

const Socials: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("twitter");
  }, [setFocus]);

  const { profile, refetchProfile } = useProfile();
  const { refetch: fetchTwitter } = useQueryApi(
    "SOCIALS_TWITTER_OAUTH",
    { enabled: false },
    "request/",
    ""
  );
  const { refetch: fetchDiscord } = useQueryApi(
    "SOCIALS_DISCORD_OAUTH",
    { enabled: false },
    "request/",
    ""
  );
  const isTwitterPinging = useRef<boolean>(false);
  const isDiscordPinging = useRef<boolean>(false);
  const twitterPingInterval = useRef<any>(null);
  const discordPingInterval = useRef<any>(null);

  const [isLoadingTwitter, setLoadingTwitter] = useState<boolean>(false);
  const [isLoadingDiscord, setLoadingDiscord] = useState<boolean>(false);

  const proceed = () => {
    setStep(profile?.membership === "founder" ? "FOUNDER" : "NO_FOUNDER");
  };

  const skip = () => {
    localStorage.setItem("zo-onboarding-socials-skipped", "true");
    proceed();
  };

  const connectTwitter = async () => {
    setLoadingTwitter(true);
    const data = await fetchTwitter();
    window.open(data?.data?.data.authorization_url, "_blank");
  };

  const connectDiscord = async () => {
    setLoadingDiscord(true);
    const data = await fetchDiscord();
    window.open(data?.data?.data.authorization_url, "_blank");
  };

  const startTwitterPinging = () => {
    isTwitterPinging.current = true;
    twitterPingInterval.current = setInterval(refetchProfile, 2000);
  };

  const cancelTwitterPinging = () => {
    isTwitterPinging.current = false;
    setLoadingTwitter(false);
    if (twitterPingInterval.current) {
      clearInterval(twitterPingInterval.current);
    }
  };

  const startDiscordPinging = () => {
    isDiscordPinging.current = true;
    discordPingInterval.current = setInterval(refetchProfile, 2000);
  };

  const cancelDiscordPinging = () => {
    isDiscordPinging.current = false;
    setLoadingDiscord(false);
    if (discordPingInterval.current) {
      clearInterval(discordPingInterval.current);
    }
  };

  const handleVisibilityCheck = () => {
    if (isClient) {
      if (!document.hidden && isLoadingTwitter && !isTwitterPinging.current) {
        startTwitterPinging();
      }
      if (!document.hidden && isLoadingDiscord && !isDiscordPinging.current) {
        startDiscordPinging();
      }
    }
  };

  useEffect(() => {
    if (profile && isLoadingTwitter) {
      if (
        profile.socials.find(
          (s: { category: string }) => s.category === "Twitter"
        )
      ) {
        cancelTwitterPinging();
      }
    }
  }, [profile, isLoadingTwitter]);

  useEffect(() => {
    if (profile && isLoadingDiscord) {
      if (
        profile.socials.find(
          (s: { category: string }) => s.category === "Discord"
        )
      ) {
        cancelDiscordPinging();
      }
    }
  }, [profile, isLoadingDiscord]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityCheck, false);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityCheck,
        false
      );
    };
  });

  const twitterHandle = useMemo(() => {
    if (profile) {
      const twitter = profile.socials.find(
        (s: { category: string }) => s.category === "Twitter"
      );
      if (twitter) {
        return twitter.link.split(".com/")[1];
      }
    }
    return null;
  }, [profile]);

  const discordLink = useMemo(() => {
    if (profile) {
      const discord = profile.socials.find(
        (s: { category: string }) => s.category === "Discord"
      );
      if (discord) {
        return discord.data.username + "#" + discord.data.discriminator;
      }
    }
    return null;
  }, [profile]);

  return (
    <div className="flex flex-1 flex-col items-start">
      <span className="text-xl text-start">Connect your social profile</span>
      <span className="mt-2">
        Let people know and follow you on your social account.
      </span>

      {isLoadingTwitter ? (
        <div className="flex flex-col mt-8 items-start">
          <i className="uil uil-spinner animate-spin text-3xl" />
          <span className="mt-2">Waiting for a response from Twitter ...</span>
          <button
            className="font-semibold mt-2 underline"
            onClick={cancelTwitterPinging}
          >
            Cancel
          </button>
        </div>
      ) : isLoadingDiscord ? (
        <div className="flex flex-col mt-8 items-start">
          <i className="uil uil-spinner animate-spin text-3xl" />
          <span className="mt-2">Waiting for a response from Discord ...</span>
          <button
            className="font-semibold mt-2 underline"
            onClick={cancelDiscordPinging}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-col mt-8 space-y-8 items-start">
          {twitterHandle != null ? (
            <span>
              <i className="uil uil-twitter text-[#1DA1F2]" /> Connected to{" "}
              <strong className="text-[#1DA1F2]">@{twitterHandle}</strong>
            </span>
          ) : (
            <button
              className="flex px-8 py-4 bg-zui-white text-zui-dark"
              onClick={connectTwitter}
            >
              Connect Twitter
            </button>
          )}
          {discordLink != null ? (
            <span>
              <i className="uil uil-discord text-[#5865F2]" /> Connected to{" "}
              <strong className="text-[#5865F2]">{discordLink}</strong>
            </span>
          ) : (
            <button
              className="flex px-8 py-4 bg-zui-white text-zui-dark"
              onClick={connectDiscord}
            >
              Connect Discord
            </button>
          )}

          {!isLoadingDiscord &&
            !isLoadingTwitter &&
            (twitterHandle != null || discordLink != null ? (
              <button
                className="flex px-8 py-4 bg-zui-white text-zui-dark mt-8"
                onClick={proceed}
              >
                Proceed
              </button>
            ) : (
              <button className="mt-4 underline font-medium" onClick={skip}>
                I don't want to connect socially
              </button>
            ))}
        </div>
      )}

      <span className="mt-auto text-sm my-4">
        In case of any issue, raise a ticket on{" "}
        <a
          className="underline font-semibold hover:text-[#7289DA] cursor-pointer"
          href="https://discord.gg/zoworld"
          rel="noreferrer"
          target="_blank"
        >
          our discord
        </a>
        .
      </span>
    </div>
  );
};

export default Socials;
