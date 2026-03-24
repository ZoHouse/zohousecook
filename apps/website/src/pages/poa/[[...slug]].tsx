import Icon from "@zo/assets/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { formatCapitalize, isValidString, isValidUUID } from "@zo/utils/string";
import { formatAddress, isValidAddress } from "@zo/utils/web3";
import {
  PoaDropStatus,
  PoaMetadata,
  PublicPoaData,
} from "apps/website/src/config";
import { showToast } from "libs/moal/src/utils";
import moment from "moment";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Modal } from "../../components/ui";
import { rubikClassName } from "../../components/utils";

interface PoaProps {}

const Poa: React.FC<PoaProps> = () => {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const isStatusCheckPinging = useRef<boolean>(false);
  const statusPingInterval = useRef<NodeJS.Timeout | null>(null);

  const [statusChecking, setStatusChecking] = useState<boolean>(false);
  const [isSuccessModalOpen, setSuccessModalOpen] = useState<boolean>(false);

  const { mutate: createPoadrop } = useMutationApi("WEBTHREE_PUBLIC_POA");

  const tokenId = useMemo(() => router.query.slug?.[0], [router.query.slug]);
  const poaId = useMemo(() => router.query.slug?.[1], [router.query.slug]);

  const isValidPoaId = useMemo(() => isValidUUID(poaId), [poaId]);
  const isWalletAddressValid = useMemo(
    () => isValidString(walletAddress) && isValidAddress(walletAddress),
    [walletAddress]
  );

  const { data: poaDropStatus, refetch: refetchStatus } =
    useQueryApi<PoaDropStatus>(
      "WEBTHREE_PUBLIC_POA",
      {
        refetchOnWindowFocus: false,
        select: (data) => data.data,
        enabled: isValidPoaId && isWalletAddressValid,
      },
      `${poaId}/status/`,
      `wallet_address=${walletAddress}`
    );

  const { data: publicPoa } = useQueryApi<PublicPoaData>(
    "WEBTHREE_PUBLIC_POA",
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
      enabled: !!poaId,
    },
    `${poaId}`
  );

  const { data: poaMetadata } = useQueryApi<PoaMetadata>(
    "WEBTHREE_POA_METADATA",
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
      enabled: !!tokenId,
    },
    `${tokenId}.json`
  );

  const startStatusPinging = useCallback(() => {
    isStatusCheckPinging.current = true;
    statusPingInterval.current = setInterval(refetchStatus, 5000);
    setStatusChecking(true);
  }, [refetchStatus]);

  const cancelStatusPinging = useCallback(() => {
    if (isStatusCheckPinging.current) {
      clearInterval(statusPingInterval.current as NodeJS.Timeout);
      isStatusCheckPinging.current = false;
    }
  }, []);

  const handleAirdrop = useCallback(() => {
    createPoadrop(
      {
        data: {
          wallet_address: walletAddress,
          key: tokenId,
        },
        route: `${poaId}/claim/`,
      },
      {
        onSuccess() {
          startStatusPinging();
        },
        onError(error) {
          showToast("error", processResponseError(error));
        },
      }
    );
  }, [walletAddress, tokenId, poaId, createPoadrop, startStatusPinging]);

  useEffect(() => {
    if (statusChecking && poaDropStatus) {
      const { status } = poaDropStatus;
      if (status === "success") {
        cancelStatusPinging();
        setSuccessModalOpen(true);
      }
      if (["failed", "cancelled"].includes(status)) {
        cancelStatusPinging();
      }
    }
  }, [poaDropStatus, statusChecking, cancelStatusPinging]);

  const isVideo = useMemo(() => {
    const checkMediaUrl = (url: string | undefined) =>
      url?.includes("mp4") || url?.includes("aac");

    const mediaUrl = poaId
      ? checkMediaUrl(publicPoa?.video)
      : checkMediaUrl(poaMetadata?.animation_url);

    return mediaUrl;
  }, [poaId, publicPoa?.video, poaMetadata?.animation_url]);

  return (
    <>
      <section className="px-6 md:px-10 mt-20 w-full max-w-md mx-auto">
        <h2
          className={cn(
            "text-center sub-heading-3 italic pointer-events-none w-full font-bold",
            rubikClassName
          )}
        >
          {poaId ? publicPoa?.title : poaMetadata?.name} <br />
        </h2>

        <hr className="w-full horizontal-divider my-10" />

        <div className="w-fit h-fit mx-auto relative mt-10 mb-6 flex justify-center items-center">
          <img
            className="absolute w-14 aspect-square z-10 top-0 left-0 -translate-y-1/2 -translate-x-1/2"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/2e7e3b93-1065-4f80-92b1-c2c818b09f64_20240911105307.gif`}
            alt="poa"
          />
          {isVideo ? (
            <video
              muted
              autoPlay
              loop
              playsInline
              className="w-48 aspect-square rounded-2xl -rotate-[4deg]"
              src={poaId ? publicPoa?.video : poaMetadata?.animation_url}
            />
          ) : (
            <img
              className="w-48 aspect-square rounded-2xl -rotate-[4deg]"
              src={poaId ? publicPoa?.image : poaMetadata?.image}
              alt="poa"
            />
          )}
          <img
            className="absolute w-14 aspect-square z-10 right-0 bottom-0 translate-y-1/2 translate-x-1/2"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/2e7e3b93-1065-4f80-92b1-c2c818b09f64_20240911105307.gif`}
            alt="poa"
          />
        </div>

        <div className="text-center mt-8">
          <h6
            className={cn(
              "font-medium leading-6 tracking-[0.16px]",
              rubikClassName
            )}
          >
            {poaDropStatus?.status === "success"
              ? "You have minted"
              : poaId
              ? publicPoa?.description
              : poaMetadata?.description}
          </h6>

          {moment(publicPoa?.claim_start).isBefore(moment()) ? (
            <p className="mt-4 text-zui-silver">
              This event has ended. Thank you for participating!
            </p>
          ) : poaDropStatus?.status === "success" ? (
            <div></div>
          ) : (
            <div className="space-y-4 mt-4 z-20 relative">
              <input
                onChange={(e) => setWalletAddress(e.target.value)}
                value={walletAddress}
                type="text"
                className="bg-zui-light rounded-xl p-4 w-full focus:outline-none"
                placeholder="Your ETH Wallet Address"
              />

              {statusChecking ? (
                <div className="w-full p-4 text-zui-white text-center">
                  {formatCapitalize(poaDropStatus?.status || "Waiting...")}
                </div>
              ) : (
                <Button
                  onClick={handleAirdrop}
                  disabled={!isWalletAddressValid}
                  type="primary"
                  className="md:w-full"
                  showEffect={true}
                >
                  Zo Zo Zo! Send to my Wallet
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Modal
        className={cn("h-screen w-full ")}
        isOpen={isSuccessModalOpen}
        onOpenChange={setSuccessModalOpen.bind(null, false)}
        title=""
      >
        <div className="relative h-full w-full mx-auto max-w-[360px] flex flex-col items-center justify-center">
          <button
            onClick={setSuccessModalOpen.bind(null, false)}
            className="absolute top-4 right-4 z-100"
          >
            <Icon name="Cross" size={18} />
          </button>

          {isVideo ? (
            <video
              className="w-48 aspect-square rounded-2xl"
              muted
              autoPlay
              loop
              playsInline
              src={poaId ? publicPoa?.video : poaMetadata?.animation_url}
            />
          ) : (
            <img
              className="w-48 aspect-square rounded-2xl"
              src={poaId ? publicPoa?.image : poaMetadata?.image}
              alt="poa"
            />
          )}

          <span className="text-sm text-zui-silver text-center">
            {poaId ? publicPoa?.title : poaMetadata?.name}
          </span>

          <div className="text-center mt-10">
            <h6
              className={cn(
                "text-center sub-heading-3 italic pointer-events-none w-full font-bold text-gradient-white-to-lighter",
                rubikClassName
              )}
            >
              Zo Zo Zo! <br />
              <span className="not-italic font-medium">POA NFT sent to</span>
              <br />
              <span className="not-italic font-medium">
                {formatAddress(walletAddress)}
              </span>
            </h6>
            <p className="text-sm font-medium text-zui-silver mt-4">
              Check your wallet shortly.
            </p>

            {poaDropStatus &&
              isValidString(poaDropStatus?.transaction_hash) && (
                <a
                  href={`https://basescan.org/tx/${poaDropStatus.transaction_hash}`}
                  className="bg-zui-white py-2 mt-10 px-3 text-sm font-semibold text-zui-light rounded-full flex justify-start items-center gap-2"
                >
                  <Icon name="Etherscan" size={16} />
                  View transaction on Base
                </a>
              )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Poa;
