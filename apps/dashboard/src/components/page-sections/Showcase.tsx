/* eslint-disable @next/next/no-img-element */
import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isClient } from "@zo/utils/next";
import { isValidString } from "@zo/utils/string";
import { toChecksumAddress } from "@zo/utils/web3";
import { useRouter } from "next/router";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Button, QRCode } from "../common";
import { EnsModal, PFPModal } from "../modals";
import { showToast } from "libs/moal/src/utils";

interface ShowcaseProps {}

const Showcase: React.FC<ShowcaseProps> = () => {
  const [isShowcaseStarted, setShowcaseStarted] = useState<boolean>(false);

  const { profile, refetchProfile } = useProfile();
  const router = useRouter();

  const isTwitterPinging = useRef<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const twitterPingInterval = useRef<any>(null);
  const usersSlider = useRef<HTMLDivElement>(null);

  const [isLoadingTwitter, setLoadingTwitter] = useState<boolean>(false);
  const [isPFPModalVisible, setPFPModalVisible] = useState<boolean>(false);
  const [isENSModalVisible, setENSModalVisible] = useState<boolean>(false);

  const { refetch: refetchWhitelists } = useQueryApi(
    "WEBTHREE_FOUNDER_JOIN_AL",
    {
      enabled: false,
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

  const { data: users } = useQueryApi(
    "SOCIALS_SHOWCASE_USER",
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    "",
    `limit=10`
  );

  const { data: collectionData } = useQueryApi(
    "SOCIALS_SHOWCASE_COLLECTIONS",
    {
      enabled: profile != null && profile.wallet_address != null,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
    },
    ``,
    ""
  );

  const { mutateAsync: addTelegram } = useMutationApi(
    "SOCIALS_TELEGRAM_OAUTH_CALLBACK"
  );

  const isShowcasePFP = useMemo(() => {
    if (collectionData?.data && profile && profile.pfp_metadata) {
      const allowedAddresses = (collectionData.data.results || []).map(
        (c: GeneralObject) => toChecksumAddress(c.contract_ref_address)
      );
      return allowedAddresses.includes(
        toChecksumAddress(profile.pfp_metadata.contract_address)
      );
    }
    return false;
  }, [profile, collectionData?.data]);

  const twitterHandle = useMemo(() => {
    if (profile) {
      const twitter = (profile.socials || []).find(
        (s: GeneralObject) => s.category === "twitter"
      );
      if (twitter) {
        return twitter.link.split(".com/")[1];
      }
    }
    return null;
  }, [profile]);

  const telegramHandle = useMemo(() => {
    if (profile) {
      const telegram = (profile.socials || []).find(
        (s: GeneralObject) => s.category === "telegram"
      );
      if (telegram) {
        return telegram.link.split(".me/")[1];
      }
    }
    return null;
  }, [profile]);

  const animatedAdded = useRef<boolean>(false);

  const startShowcase = () => {
    setShowcaseStarted(true);
    localStorage.setItem("zo-showcased", "true");
  };

  useEffect(() => {
    if (isClient) {
      const isShowcased = localStorage.getItem("zo-showcased");
      if (isShowcased) {
        setShowcaseStarted(true);
      }
    }
  }, []);

  useEffect(() => {
    if (
      usersSlider.current &&
      users?.data &&
      !animatedAdded.current &&
      isClient
    ) {
      const style = document.getElementsByTagName("style")[0];
      const keyframe = `\
        @keyframes animation-scroll-auto {\
            0% {\
                margin-left: 0px;\
            }\
            100% {\
                margin-left: -${usersSlider.current.scrollWidth / 2}px;\
            }\
        }\
        .animated-scroll-left {\
            animation: animation-scroll-auto 40s linear infinite;\
            -moz-animation: animation-scroll-auto 40s linear infinite;\
            -webkit-animation: animation-scroll-auto 40s linear infinite;\
            -o-animation: animation-scroll-auto 40s linear infinite;\
        }\
    `;
      if (style) {
        style.innerHTML += keyframe;
      }
      animatedAdded.current = true;
      if (usersSlider.current.querySelector("#animated-scroll")) {
        usersSlider.current
          .querySelector("#animated-scroll")
          ?.classList.add("animated-scroll-left");
      }
    }
  }, [users?.data]);

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
        (profile.socials || []).find(
          (s: { category: string }) => s.category === "twitter"
        )
      ) {
        cancelTwitterPinging();
        refetchWhitelists();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleTelegramResponse = async (response: GeneralObject) => {
    addTelegram(
      {
        data: {
          ...response,
        },
      },
      {
        onSuccess: () => {
          showToast("success", "Telegram Added.");
          setTimeout(() => {
            refetchProfile();
            router.push("/");
          }, 1000);
        },
        onError: showToast.bind(null, "error", "Failed To Add Telegram"),
      }
    );
  };

  const connectTelegram = () => {
    setPFPModalVisible(false);
    setENSModalVisible(false);

    const url = "https://t.me/ZoGatekeeperBot?start=";

    window.open(url, "_blank");
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#tgAuthResult=")) {
      try {
        const tgAuthResult = hash.replace("#tgAuthResult=", "");
        const decodedResult = JSON.parse(atob(tgAuthResult));
        handleTelegramResponse(decodedResult);
      } catch (error) {
        console.error("Failed to decode Telegram auth result:", error);
      }
    }
  }, []);

  // Check if any of the services are connected
  const hasAnySocialsConnected = useMemo(() => {
    return (
      isValidString(twitterHandle) ||
      isValidString(profile?.ens_nickname) ||
      isValidString(telegramHandle)
    );
  }, [twitterHandle, profile?.ens_nickname, telegramHandle]);

  useEffect(() => {
    if (hasAnySocialsConnected) {
      startShowcase();
    } else {
      setShowcaseStarted(false);
      localStorage.removeItem("zo-showcased");
    }
  }, [hasAnySocialsConnected]);

  return (
    <div
      className={`bg-zui-magenta relative text-zui-black ${
        isShowcaseStarted ? "border border-zinc-800" : "border border-black"
      } flex-shrink-0 flex flex-col w-full h-[calc(16/9*98vw)] md:w-[calc(9/16*860px)] md:h-[860px]`}
    >
      <h3
        className={` font-bold w-full ${
          isShowcaseStarted
            ? "absolute pb-56 z-[1] bg-gradient-to-b from-zui-black to-transparent text-zui-white"
            : "text-zui-black"
        } text-5xl flex-shrink-0 px-4 pt-4`}
      >
        Showcase
      </h3>
      {isShowcaseStarted ? (
        <div className="flex flex-col w-full divide-y-2 divide-zinc-800 flex-1">
          {isValidString(profile?.pfp_image) ? (
            isShowcasePFP ? (
              isValidString(twitterHandle) ? (
                isValidString(profile?.ens_nickname) ? (
                  <div className="p-2 absolute z-[1] top-16 left-4 right-4 mt-4 flex items-start text-zui-white bg-black">
                    <i className="uil uil-check-circle text-3xl flex-shrink-0 mr-2" />
                    <div className="flex flex-col items-start flex-grow">
                      <span className="font-semibold">Showcase Ready</span>
                      <span className="text-sm">
                        Your profile will be showcased in Zo House.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 absolute z-[1] top-16 left-4 right-4 mt-4 flex items-start text-zui-white bg-black">
                    <i className="uil uil-info-circle text-3xl flex-shrink-0 mr-2" />
                    <div className="flex flex-col items-start flex-grow">
                      <span className="font-semibold">ENS Required</span>
                      <span className="text-sm">
                        You need to set an ENS nickname for Showcase.
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-2 absolute z-[1] top-16 left-4 right-4 mt-4 flex items-start text-zui-white bg-black">
                  <i className="uil uil-info-circle text-3xl flex-shrink-0 mr-2" />
                  <div className="flex flex-col items-start flex-grow">
                    <span className="font-semibold">
                      Twitter Connection Required
                    </span>
                    <span className="text-sm">
                      You need to connect your Twitter account for Showcase.
                    </span>
                  </div>
                </div>
              )
            ) : (
              <div className="p-2 absolute z-[1] top-16 left-4 right-4 mt-4 flex items-start text-zui-white bg-black">
                <i className="uil uil-info-circle text-3xl flex-shrink-0 mr-2" />
                <div className="flex flex-col items-start flex-grow">
                  <span className="font-semibold">PFP not supported</span>
                  <span className="text-sm">
                    Only a certain set of collections are allowed for Showcase.
                    Your current PFP is not from those collections.
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="p-2 absolute z-[1] top-16 left-4 right-4 mt-4 flex items-center text-zui-white bg-black">
              <i className="uil uil-info-circle text-2xl flex-shrink-0 mr-2" />
              <div className="flex flex-col items-start flex-grow">
                <span className="font-semibold">PFP Required</span>
                <span>You need to have a PFP for Showcase.</span>
              </div>
            </div>
          )}
          <div className="w-full flex flex-col h-full">
            {isValidString(profile?.pfp_image) ? (
              <div className="flex items-center flex-1 justify-center">
                <img
                  src={profile.pfp_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute inset-0 flex-1 bg-black bg-opacity-50 text-zui-white w-full flex flex-col items-center justify-center"
                  onClick={setPFPModalVisible.bind(null, true)}
                >
                  <i className="uil uil-pen text-2xl" />
                </button>
              </div>
            ) : (
              <button
                className="flex-1 w-full bg-zui-magenta flex flex-col items-center justify-center"
                onClick={setPFPModalVisible.bind(null, true)}
              >
                <i className="uil uil-pen text-2xl" />
                <span className="font-semibold text-xl mt-4">Select PFP</span>
              </button>
            )}
          </div>
          <div className="flex flex-col relative flex-shrink-0 justify-end w-full h-content bg-black max-h-36">
            <div className="flex h-full">
              <QRCode
                link={
                  "https://twitter.com/" + (twitterHandle || "the_zo_world")
                }
                className="w-auto relative h-full flex-shrink-0 border-r border-zinc-800"
              >
                {twitterHandle == null && (
                  <div className="absolute inset-0 bg-opacity-80 text-sm font-medium bg-zui-black text-zui-white flex text-center items-center justify-center">
                    Connect Twitter first
                  </div>
                )}
              </QRCode>

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
                  <button
                    className="flex items-center space-x-2 p-2 w-full"
                    onClick={connectTwitter}
                  >
                    <div className="w-8 h-8 flex flex-shrink-0 items-center justify-center">
                      <i className="uil uil-twitter text-2xl text-[#1DA1F2]" />
                    </div>
                    <span className="text-sm font-medium truncate overflow-hidden">
                      Connect Twitter
                    </span>
                    <i className="uil uil-arrow-right text-xl" />
                  </button>
                )}
                {profile?.ens_nickname != null ? (
                  <div className="flex items-center space-x-2 p-2 w-full">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ethereum_logo_translucent.svg"
                      className="w-8 h-8 flex-shrink-0"
                      alt=""
                    />
                    <span className="text-sm font-medium truncate overflow-hidden">
                      {profile?.ens_nickname}
                    </span>
                    <button
                      onClick={setENSModalVisible.bind(null, true)}
                      className="px-2 flex-shrink-0 pb-1"
                    >
                      <i className="uil text-sm uil-pen" />
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex items-center space-x-2 p-2 w-full"
                    onClick={setENSModalVisible.bind(null, true)}
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ethereum_logo_translucent.svg"
                      className="w-8 h-8"
                      alt=""
                    />
                    <span className="text-sm font-medium truncate overflow-hidden">
                      Select ENS
                    </span>
                    <i className="uil uil-arrow-right text-xl" />
                  </button>
                )}

                {isValidString(telegramHandle) ? (
                  <div className=" flex items-center space-x-2 p-2 w-full">
                    <div className="w-8 h-8 flex flex-shrink-0 items-center justify-center">
                      <i className="uil uil-telegram text-2xl text-[#1DA1F2]" />
                    </div>
                    <span className="text-sm font-medium truncate overflow-hidden">
                      @{telegramHandle}
                    </span>
                  </div>
                ) : (
                  <button
                    className="flex items-center space-x-2 p-2 w-full"
                    onClick={connectTelegram}
                  >
                    <i className="uil uil-telegram text-2xl text-[#1DA1F2]" />
                    <span className="text-sm font-medium truncate overflow-hidden">
                      Connect Telegram
                    </span>
                    <i className="uil uil-arrow-right text-xl" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col mt-4">
          <p className="text-2xl font-semibold pb-4 w-5/6 px-4">
            Exist in the Zo Metaverse without being there physically.
          </p>
          <div className="flex-1 overflow-hidden">
            <div className="flex-1 flex flex-nowrap" ref={usersSlider}>
              {(users?.data?.results || []).map(
                (user: GeneralObject, i: number) => (
                  <User key={i} index={i} user={user} focus="all" />
                )
              )}
              {(users?.data?.results || []).map(
                (user: GeneralObject, i: number) => (
                  <User key={i} user={user} focus="all" />
                )
              )}
            </div>
          </div>
          <div className="flex flex-col w-full p-4">
            {!hasAnySocialsConnected && (
              <Button
                fixedsize
                icon="arrow-right"
                className="justify-between"
                iconClassName="text-2xl"
                onClick={startShowcase}
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      )}
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

const User: FC<GeneralObject> = ({ user, index }) => {
  return (
    <div
      className={`flex flex-col flex-shrink-0 border-2 mr-4 border-zui-black relative items-center justify-center w-[59vw] h-[calc(16/9*59vw)] md:h-[564px] md:w-[calc(9/16*564px)] ${
        index === 0 ? "ml-4 " : ""
      }`}
      id={index === 0 ? "animated-scroll" : ""}
    >
      <div className="w-full flex flex-col h-full">
        <div className="flex items-center flex-1 justify-center">
          <img
            src={user?.pfp_image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="flex flex-col relative flex-shrink-0 justify-end w-full h-content bg-black">
        <div className="flex h-full">
          {user?.twitter_handle != null && (
            <QRCode
              link={"https://twitter.com/" + user.twitter_handle}
              className="w-[66px] relative h-[66px] flex-shrink-0 border-r border-zinc-800"
            ></QRCode>
          )}

          <div className="flex flex-col w-full overflow-hidden items-stretch text-zui-white justify-end divide-y divide-zinc-800">
            {user?.twitter_handle != null && (
              <div className=" flex items-center space-x-2 p-2 w-full">
                <div className="w-4 h-4 flex flex-shrink-0 items-center justify-center">
                  <i className="uil uil-twitter text-[#1DA1F2]" />
                </div>
                <span className="text-xs font-medium truncate overflow-hidden">
                  @{user.twitter_handle}
                </span>
              </div>
            )}
            <div className=" flex items-center space-x-2 p-2 w-full">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ethereum_logo_translucent.svg"
                className="w-4 h-4 flex-shrink-0"
                alt=""
              />
              <span className="text-xs font-medium truncate overflow-hidden">
                {user?.nickname}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Showcase;
