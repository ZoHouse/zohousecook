import Icon from "@zo/assets/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { formatCapitalize, isValidString, isValidUUID } from "@zo/utils/string";
import { formatAddress, isValidAddress } from "@zo/utils/web3";
import { PoaDropStatus } from "apps/website/src/config";
import { showToast } from "libs/moal/src/utils";
import React, { useEffect, useRef, useState } from "react";
import { Button, Modal } from "../../ui";
import { rubikClassName } from "../../utils";

interface MintYourPoaSectionProps {}

const SINGAPORE_EVENT_POA_ID = process.env.SINGAPORE_EVENT_POA_ID || "";

const MintYourPoaSection: React.FC<MintYourPoaSectionProps> = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");

  const isStatusCheckPinging = useRef<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusPingInterval = useRef<any>(null);

  const [statusChecking, setStatusChecking] = useState<boolean>(false);

  const [isSuccessModalOpen, setSuccessModalOpen] = useState<boolean>(false);

  const { mutate: createPoadrop } = useMutationApi("WEBTHREE_PUBLIC_POA");

  const { data: poaDropStatus, refetch: refetchStatus } =
    useQueryApi<PoaDropStatus>(
      "WEBTHREE_PUBLIC_POA",
      {
        refetchOnWindowFocus: false,
        select: (data) => data.data,
        enabled:
          isValidUUID(SINGAPORE_EVENT_POA_ID) && isValidString(walletAddress),
      },
      `${SINGAPORE_EVENT_POA_ID}/status/`,
      `wallet_address=${walletAddress}`
    );

  const handleAirdrop = () => {
    createPoadrop(
      {
        data: {
          wallet_address: walletAddress,
        },
        route: `${SINGAPORE_EVENT_POA_ID}/claim/`,
      },
      {
        onSuccess(data) {
          startStatusPinging();
        },
        onError(error) {
          showToast("error", processResponseError(error));
        },
      }
    );
  };

  const startStatusPinging = () => {
    isStatusCheckPinging.current = true;
    statusPingInterval.current = setInterval(refetchStatus, 5000);
    setStatusChecking(true);
  };

  const cancelStatusPinging = () => {
    isStatusCheckPinging.current = false;
    if (isStatusCheckPinging.current) {
      clearInterval(statusPingInterval.current);
    }
  };

  useEffect(() => {
    if (statusChecking && poaDropStatus) {
      if (poaDropStatus.status === "success") {
        cancelStatusPinging();
        setSuccessModalOpen(true);
      }
      if (["failed", "cancelled"].includes(poaDropStatus.status)) {
        cancelStatusPinging();
      }
    }
  }, [poaDropStatus, statusChecking]);

  return (
    <>
      <section className="p-6 md:p-10 w-full max-w-md mx-auto">
        <h2
          className={cn(
            "text-center sub-heading-3 italic pointer-events-none w-full font-bold",
            rubikClassName
          )}
        >
          Global Crypto Events <br />
          <span className="font-medium not-italic">in Singapore</span>
        </h2>
        <hr className="w-full horizontal-divider my-10" />

        <div className="w-fit h-fit mx-auto relative mt-10 mb-6 flex justify-center items-center">
          <img
            className="absolute w-14 aspect-square z-10 top-0 left-0 -translate-y-1/2 -translate-x-1/2"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/2e7e3b93-1065-4f80-92b1-c2c818b09f64_20240911105307.gif`}
            alt="animated-stars"
          />
          <video
            muted
            autoPlay
            loop
            playsInline
            className="w-48 aspect-square rounded-2xl -rotate-[4deg]"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/c449d5bc-54fb-4bdd-90be-6c6c4c7f431e_20240913084532.mp4`}
          />
          <img
            className="absolute w-14 aspect-square z-10 right-0 bottom-0 translate-y-1/2 translate-x-1/2"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/2e7e3b93-1065-4f80-92b1-c2c818b09f64_20240911105307.gif`}
            alt="animated-stars"
          />
        </div>

        <div className="text-center mt-6">
          <h6
            className={cn(
              "font-medium leading-6 tracking-[0.16px]",
              rubikClassName
            )}
          >
            {poaDropStatus?.status === "success" ? "You have minted" : "Mint"}{" "}
            your Proof of Attendance <br /> for Token 2049, Singapore
          </h6>
          {poaDropStatus?.status !== "success" && (
            <p className="text-sm font-medium text-zui-silver mt-4">
              🔒 Mint without connecting Wallet
            </p>
          )}

          {poaDropStatus?.status === "success" ? (
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
                  disabled={!isValidAddress(walletAddress)}
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
          <video
            className="w-48 aspect-square rounded-2xl"
            muted
            autoPlay
            loop
            playsInline
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/videos/c449d5bc-54fb-4bdd-90be-6c6c4c7f431e_20240913084532.mp4`}
          />
          <span className="text-sm text-zui-silver text-center">
            Token2049 Singapore
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

export default MintYourPoaSection;
