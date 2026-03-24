/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { useProfile, useQueryApi } from "@zo/auth";
import { isClient } from "@zo/utils/next";
import React, { useEffect, useRef, useState } from "react";
import { useLogin } from "../../hooks";

interface FriendStatusProps {}

const FriendStatus: React.FC<FriendStatusProps> = () => {
  const { isLoggedIn } = useLogin();
  const { profile, refetchProfile } = useProfile();

  const isTwitterPinging = useRef<boolean>(false);
  const twitterPingInterval = useRef<any>(null);

  const [isLoadingTwitter, setLoadingTwitter] = useState<boolean>(false);

  const { data: whitelists, refetch: refetchWhitelists } = useQueryApi(
    "WEBTHREE_FOUNDER_JOIN_AL",
    {
      enabled: isLoggedIn === true && profile?.wallet_address != null,
    },
    "",
    `wallet_address=${profile?.wallet_address}`
  );

  const { refetch: fetchTwitter } = useQueryApi(
    "SOCIALS_TWITTER_OAUTH",
    { enabled: false },
    "request/",
    ""
  );

  const whitelist = whitelists?.data;

  const connectTwitter = async () => {
    setLoadingTwitter(true);
    const data = await fetchTwitter();
    window.open(data?.data?.data.authorization_url, "_blank");
  };

  const startTwitterPinging = () => {
    isTwitterPinging.current = true;
    twitterPingInterval.current = setInterval(refetchWhitelists, 2000);
  };

  const cancelTwitterPinging = () => {
    isTwitterPinging.current = false;
    setLoadingTwitter(false);
    if (twitterPingInterval.current) {
      clearInterval(twitterPingInterval.current);
    }
  };

  const handleVisibilityCheck = () => {
    if (isClient) {
      if (!document.hidden && isLoadingTwitter && !isTwitterPinging.current) {
        startTwitterPinging();
      }
    }
  };

  useEffect(() => {
    if (whitelist && isLoadingTwitter) {
      if (whitelist.twitter_verified) {
        cancelTwitterPinging();
        refetchProfile();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whitelist, isLoadingTwitter]);

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

  return (
    whitelist?.referred_by != null && (
      <>
        <div className="w-full bg-zui-green flex flex-col mb-4 text-zui-black p-4">
          <h3 className=" flex-shrink-0 font-bold text-5xl">
            Your Allowlist Status
          </h3>

          <div className="flex flex-col md:flex-row md:space-x-2 items-start mt-4 w-full">
            <div className="flex items-center space-x-2 text-sm md:text-base">
              <div className="w-content h-content bg-zui-green rounded-full">
                {whitelist.registered ? (
                  <i className="uil uil-check-circle text-2xl" />
                ) : (
                  <i className="uil uil-clock text-2xl" />
                )}
              </div>
              <span>
                Registration {whitelist.registered ? "complete" : "pending"}
              </span>
            </div>
            {whitelist.registered ? (
              <div className="border-l-2 border-zui-black h-6 md:h-auto md:w-12 md:border-l-0 md:border-t-2 relative left-3 md:left-0 md:top-4" />
            ) : (
              <div className="border-l-2 border-dashed border-zui-black h-6 md:h-auto md:w-12 md:border-l-0 md:border-t-2 relative left-3 md:left-0 md:top-4" />
            )}
            <div
              className={`flex items-center space-x-2 text-sm md:text-base ${
                !whitelist.registered && "opacity-40"
              }`}
            >
              <div className="w-content h-content bg-zui-green rounded-full">
                {whitelist.twitter_verified ? (
                  <i className="uil uil-check-circle text-2xl" />
                ) : (
                  <i className="uil uil-clock text-2xl" />
                )}
              </div>
              {whitelist.twitter_verified ? (
                <span>Twitter verified</span>
              ) : whitelist.registered ? (
                <span>
                  Twitter verification pending.{" "}
                  <button
                    className="underline font-semibold"
                    onClick={connectTwitter}
                  >
                    Click here to verify
                  </button>
                </span>
              ) : (
                <span>Twitter verification pending</span>
              )}
            </div>
            {whitelist.twitter_verified ? (
              <div className="border-l-2 border-zui-black h-6 md:h-auto md:w-12 md:border-l-0 md:border-t-2 relative left-3 md:left-0 md:top-4" />
            ) : (
              <div
                className={`border-l-2 border-dashed border-zui-black h-6 md:h-auto md:w-12 md:border-l-0 md:border-t-2 relative left-3 md:left-0 md:top-4 ${
                  !whitelist.registered && "opacity-40"
                }`}
              />
            )}
            <div
              className={`flex items-center space-x-2 text-sm md:text-base ${
                (!whitelist.registered || !whitelist.twitter_verified) &&
                "opacity-40"
              }`}
            >
              <div className="w-content h-content bg-zui-green rounded-full">
                {whitelist.status === 1 ? (
                  <i className="uil uil-clock text-2xl" />
                ) : whitelist.status === 2 ? (
                  <i className="uil uil-check-circle text-2xl" />
                ) : (
                  <i className="uil uil-times-circle text-2xl" />
                )}
              </div>
              <span>
                Allowlist{" "}
                {whitelist.status === 1
                  ? "pending"
                  : whitelist.status === 2
                  ? "approved"
                  : "rejected"}
              </span>
            </div>
          </div>
          {isLoadingTwitter && (
            <div className="fixed inset-0 bg-zui-black bg-opacity-80 z-50 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-zui-white flex items-center justify-center">
                  <i className="uil uil-twitter text-5xl text-[#1DA1F2]" />
                </div>
                <span className="text-lg text-zui-white">Please wait...</span>
                <button
                  className="font-semibold text-zui-white underline mt-8"
                  onClick={cancelTwitterPinging}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    )
  );
};

export default FriendStatus;
