/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @next/next/no-img-element */
import { useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isClient } from "@zo/utils/next";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../common";
import { EnsModal, PFPModal } from "../modals";

interface CustomiseAvatarProps {}

const CustomiseAvatar: React.FC<CustomiseAvatarProps> = () => {
  const { profile, refetchProfile } = useProfile();
  const router = useRouter();

  const isTwitterPinging = useRef<boolean>(false);
  const twitterPingInterval = useRef<any>(null);
  const qrCodeCanvasRef = useRef<HTMLDivElement>(null);

  const [isLoadingTwitter, setLoadingTwitter] = useState<boolean>(false);
  const [isPFPModalVisible, setPFPModalVisible] = useState<boolean>(false);
  const [isENSModalVisible, setENSModalVisible] = useState<boolean>(false);

  const { refetch: fetchTwitter } = useQueryApi(
    "SOCIALS_TWITTER_OAUTH",
    { enabled: false },
    "request/",
    ""
  );

  const twitterHandle = useMemo(() => {
    if (profile) {
      const twitter = profile.socials.find(
        (s: GeneralObject) => s.category === "Twitter"
      );
      if (twitter) {
        return twitter.link.split(".com/")[1];
      }
    }
    return null;
  }, [profile]);

  useEffect(() => {
    if (twitterHandle && isClient) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QrCode = require("qr-code-styling");
      const qrCode = new QrCode({
        width: 300,
        height: 300,
        type: "svg",
        data: "https://twitter.com/" + twitterHandle,
        image:
          "https://upload.wikimedia.org/wikipedia/commons/4/4f/Twitter-logo.svg",
        dotsOptions: {
          type: "rounded",
        },
        backgroundOptions: {
          color: "#e9ebee",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 20,
        },
      });
      if (!qrCodeCanvasRef.current?.hasChildNodes()) {
        qrCode.append(qrCodeCanvasRef.current);
        const qrCodeSVG = qrCodeCanvasRef.current?.querySelector("svg");
        if (qrCodeSVG) {
          qrCodeSVG.setAttribute("viewBox", "0 0 300 300");
          qrCodeSVG.setAttribute("width", "100%");
          qrCodeSVG.setAttribute("height", "100%");
        }
      }
    }
  }, [twitterHandle]);

  const connectTwitter = async () => {
    setLoadingTwitter(true);
    const data = await fetchTwitter();
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

  const handleVisibilityCheck = () => {
    if (isClient) {
      if (!document.hidden && isLoadingTwitter && !isTwitterPinging.current) {
        startTwitterPinging();
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
    document.addEventListener("visibilitychange", handleVisibilityCheck, false);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityCheck,
        false
      );
    };
  });

  const handleENSClose = () => {
    refetchProfile();
    setENSModalVisible(false);
  };

  const handlePFPClose = () => {
    refetchProfile();
    setPFPModalVisible(false);
  };

  const showWallets = () => {
    setPFPModalVisible(false);
    setENSModalVisible(false);
    router.push("#connected-wallets");
  };

  const openTwitterHandle = () => {
    window?.open(`https://twitter.com/${twitterHandle}`);
  };

  return (
    <div className="w-content m-4 border border-zui-black bg-black">
      <div className="p-4 flex flex-col">
        <h3 className="font-bold text-2xl md:text-4xl">
          Customise your Avatar
        </h3>
        {/* <span className="md:text-lg md:mt-2">Choose your appearance</span> */}
      </div>
      <div className="flex flex-col md:flex-row items-stretch md:h-[60vh] md:w-[80vh] w-full  bg-black border-t border-zui-black text-zui-white">
        <div className="flex flex-col order-2 flex-shrink-0 w-full md:w-[calc(60vh*9/16)] items-start h-[calc(90vw*16/9)] md:h-full relative bg-zui-black border-t md:border-t-0 md:border-l border-zui-black">
          <h2 className="absolute top-0 left-0 p-4 w-full text-lg font-bold pb-20 bg-gradient-to-b from-zui-black to-transparent">
            Preview
          </h2>
          {profile?.pfp_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="flex items-center flex-1 justify-center">
              <img
                src={profile.pfp_image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex-1 w-full bg-zui-violet" />
          )}
          <div className="flex flex-col flex-shrink-0 border-t border-zinc-800 justify-end w-full h-content bg-black">
            <div className="flex">
              <div
                ref={qrCodeCanvasRef}
                className="w-24 h-24 flex-shrink-0 border-r border-zinc-800"
              ></div>
              <div className="flex flex-col w-full overflow-hidden items-stretch text-zui-white justify-end divide-y divide-zinc-800">
                {twitterHandle != null ? (
                  <div className=" flex items-center space-x-2 p-2 w-full">
                    <div className="w-8 h-8 flex flex-shrink-0 items-center justify-center">
                      <i className="uil uil-twitter text-2xl text-[#1DA1F2]" />
                    </div>
                    <span className="text-sm font-medium truncate overflow-hidden">
                      @{twitterHandle}
                    </span>
                  </div>
                ) : (
                  <div className=" flex items-center space-x-2 p-2 w-full">
                    <div className="w-8 h-8 flex flex-shrink-0 items-center justify-center">
                      <i className="uil uil-twitter text-2xl text-[#1DA1F2]" />
                    </div>
                    <span className="text-sm font-medium truncate overflow-hidden">
                      {/* Connect Twitter */}
                    </span>
                  </div>
                )}
                {profile?.ens_nickname ? (
                  <div className=" flex items-center space-x-2 p-2 w-full">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ethereum_logo_translucent.svg"
                      className="w-8 h-8"
                      alt=""
                    />
                    <span className="text-sm font-medium truncate overflow-hidden">
                      {profile?.ens_nickname}
                    </span>
                  </div>
                ) : (
                  <div className=" flex items-center space-x-2 p-2 w-full">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ethereum_logo_translucent.svg"
                      className="w-8 h-8"
                      alt=""
                    />
                    <span className="text-sm font-medium truncate overflow-hidden">
                      {/* Choose ENS */}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex order-1 flex-col w-full">
          {/* <h2 className="text-3xl font-bold  flex-shrink-0 p-4">
          
        </h2> */}
          <div className="flex flex-col w-full divide-y overflow-y-auto divide-zinc-800 flex-1">
            <div className="p-4 flex flex-col w-full">
              <span className=" font-semibold">Profile Picture</span>
              {profile?.pfp_image != null ? (
                <button
                  className="w-40 h-40 border border-zui-black relative mt-4"
                  onClick={setPFPModalVisible.bind(null, true)}
                >
                  <img
                    src={profile.pfp_image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <i className="uil uil-pen text-4xl" />
                  </div>
                </button>
              ) : (
                <Button
                  className="self-start mt-4"
                  icon="arrow-right"
                  fixedsize
                  onClick={setPFPModalVisible.bind(null, true)}
                >
                  Choose PFP
                </Button>
              )}
            </div>
            <div className="p-4 flex flex-col w-full">
              <span className=" font-semibold block">ENS</span>
              {profile?.ens_nickname != null ? (
                <button
                  className="flex items-center mt-4"
                  onClick={setENSModalVisible.bind(null, true)}
                >
                  <span className=" text-lg">{profile?.ens_nickname}</span>
                  <i className="uil uil-pen  text-xl pl-4" />
                </button>
              ) : (
                <Button
                  className="self-start mt-4"
                  icon="arrow-right"
                  fixedsize
                  onClick={setENSModalVisible.bind(null, true)}
                >
                  Choose ENS
                </Button>
              )}
            </div>
            <div className="p-4 flex flex-col w-full">
              <span className=" font-semibold block">Twitter</span>
              {twitterHandle != null ? (
                <button
                  className="flex items-center mt-4"
                  onClick={openTwitterHandle}
                >
                  <span className=" text-lg">@{twitterHandle}</span>
                  <i className="uil uil-external-link-alt  text-xl pl-4" />
                </button>
              ) : (
                <Button
                  className="self-start mt-4"
                  icon="arrow-right"
                  fixedsize
                  onClick={connectTwitter}
                >
                  Connect Twitter
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {isPFPModalVisible && (
        <PFPModal close={handlePFPClose} showWallets={showWallets} />
      )}
      {isENSModalVisible && (
        <EnsModal close={handleENSClose} showWallets={showWallets} />
      )}
      {isLoadingTwitter && (
        <div className="fixed inset-0 bg-zui-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-zui-white flex items-center justify-center">
              <i className="uil uil-twitter text-5xl text-[#1DA1F2]" />
            </div>
            <span className="text-lg">Please wait...</span>
            <button
              className="font-semibold underline mt-8"
              onClick={cancelTwitterPinging}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomiseAvatar;
