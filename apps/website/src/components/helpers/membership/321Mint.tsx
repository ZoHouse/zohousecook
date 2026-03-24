import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryApi } from "@zo/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import React, { useEffect, useMemo } from "react";
import { formatEther, keccak256 } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useJoinZoContract } from "../../../hooks";
import { Timer } from "../../ui";
import WhitelistModal from "./WhitelistModal";

interface MintProps {}

const Mint: React.FC<MintProps> = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const { openConnectModal } = useConnectModal();
  const [isWhitelistModalOpen, showWhitelistModal, hideWhitelistModal] =
    useVisibilityState();
  const { saleStatus, contractConfig } = useJoinZoContract();

  const { data: allowlistData } = useQueryApi(
    "WEBTHREE_FOUNDER_JOIN_AL",
    {
      enabled: address != null,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    "",
    address != null
      ? `wallet_address=${address}&message=${keccak256(address)}`
      : ""
  );

  const { data: mintsAllowed } = useReadContract({
    ...contractConfig,
    functionName: "mintsAllowed",
    query: {
      enabled: address != null,
    },
    args: [address || ""],
  });

  const { data: available, refetch: refetchAvailable } = useReadContract({
    ...contractConfig,
    functionName: "available",
  });

  const { data: pricePerMint } = useReadContract({
    ...contractConfig,
    functionName: "pricePerMint",
  });

  const { data: hash, isPending, writeContract } = useWriteContract();

  const {
    data,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const mintStatus = useMemo(() => {
    if (isPending) {
      return {
        canMint: "waiting",
        reason: "Waiting for approval...",
      };
    }
    if (isConfirming) {
      return {
        canMint: "minting",
        reason: "Please Wait...",
      };
    }
    if (isConfirmed) {
      return {
        canMint: null,
        reason: "Zo Zo Zo! Welcome to the club.",
      };
    }
    if (address) {
      if (Number(available) > 0) {
        if (Number(mintsAllowed) > 0) {
          if (saleStatus.status === "start" || saleStatus.status === "pre") {
            if (allowlistData?.data.status === 2) {
              return {
                canMint: true,
              };
            } else {
              return {
                canMint: false,
                reason: "Zo Zo! You are not in the whitelist.",
              };
            }
          } else if (saleStatus.status === "public") {
            return {
              canMint: true,
            };
          } else {
            return {
              canMint: false,
              reason: "The public mint has ended.",
            };
          }
        } else {
          return {
            canMint: null,
            reason: "Zo Zo Zo! You got the NFT.",
          };
        }
      } else {
        return {
          canMint: "sold",
          reason: "Sold out.",
        };
      }
    } else {
      return {
        canMint: false,
        reason: "Not Connected",
      };
    }
  }, [
    isPending,
    isConfirming,
    isConfirmed,
    address,
    available,
    mintsAllowed,
    saleStatus.status,
    allowlistData?.data.status,
  ]);

  const insufficientBalance = useMemo(
    () =>
      pricePerMint != null
        ? BigInt(balance?.value || 0) <
          BigInt(String(pricePerMint)) + BigInt(300000)
        : true,
    [balance?.value, pricePerMint]
  );

  const handleMint = () => {
    if (saleStatus.status === "public") {
      writeContract({
        ...contractConfig,
        functionName: "mintPublic",
        value: pricePerMint ? BigInt(String(pricePerMint)) : BigInt(0),
        args: [],
      });
    } else if (saleStatus.status === "pre") {
      if (allowlistData?.data.allowlisted) {
        console.log("ready to mint");
        writeContract({
          ...contractConfig,
          functionName: "mint",
          args: [allowlistData?.data?.signature],
          value: pricePerMint ? BigInt(String(pricePerMint)) : BigInt(0),
          gas: BigInt(300000),
        });
      }
    }
  };

  const tokenId = useMemo(() => {
    return data?.logs[0].topics[3] ? Number(data?.logs[0].topics[3]) : null;
  }, [data?.logs]);

  useEffect(() => {
    if (isConfirmed) {
      refetchAvailable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  const openNFT = () => {
    if (tokenId) {
      window.open(
        `https://opensea.io/assets/ethereum/0xf9e631014ce1759d9b76ce074d496c3da633ba12/${tokenId}`,
        "_blank"
      );
    }
  };

  const openTransaction = () => {
    if (hash) {
      window.open(`https://etherscan.io/tx/${hash}`, "_blank");
    }
  };

  return (
    <div className="flex flex-col relative items-start justify-start max-w-[650px] mt-10 w-full">
      <div
        className={`flex flex-col ${
          mintStatus.canMint === null && tokenId != null
            ? "bg-zui-green"
            : "bg-zui-yellow"
        } text-zui-dark w-full transition-all p-6 ease-in-out duration-1000`}
      >
        <span className="zui-text-1 !font-extrabold">Buy Now</span>
        <span
          className={`${
            mintStatus.canMint === null && tokenId != null
              ? "text-zui-white"
              : "text-zui-red"
          } transition-all mt-8 !font-bold zui-heading-2 ease-in-out duration-1000 animate-pulse`}
        >
          <span>Sale Live</span>
        </span>
        <span className="zui-text-1">Only for select individuals</span>
      </div>

      {/* {(saleStatus.status === "pre" || saleStatus.status === "public") && (
        <span className="absolute flex p-[1vh] font-bold uppercase tracking-wide top-[2vh] right-[2vh]">
          {saleStatus.status === "public" ? "Public Sale" : "Sale"}
        </span>
      )} */}
      <div className="flex flex-col p-6 bg-zui-light text-zui-yellow w-full">
        {isConnected ? (
          saleStatus.status === "start" ? (
            <></>
          ) : mintStatus.canMint === true ? (
            <span className="zui-text-1 flex items-center text-zui-green space-x-2">
              <i className="uil uil-check-circle text-zui-green" />
              <span>Zo Zo! You are eligible to buy a Founder NFT.</span>
            </span>
          ) : mintStatus.canMint === "sold" ? (
            <span className="text-3xl uppercase tracking-wide font-bold p-8 text-zui-yellow flex items-center space-x-2 border-y-2 border-zui-yellow">
              SOLD OUT
            </span>
          ) : (
            <span className="zui-text-1 flex items-center text-zui-yellow space-x-4">
              {mintStatus.canMint === null ? (
                <i className="uil uil-trophy text-zui-green" />
              ) : mintStatus.canMint === "minting" ||
                mintStatus.canMint === "waiting" ? (
                <i className="uil uil-spinner text-zui-yellow" />
              ) : (
                <i className="uil uil-times-circle text-zui-yellow" />
              )}
              <span
                className={mintStatus.canMint === null ? "text-zui-green" : ""}
              >
                {mintStatus.reason}
              </span>
            </span>
          )
        ) : (
          <span className="zui-text-1 flex items-center text-zui-white space-x-2">
            Check if you&apos;re eligible to buy
          </span>
        )}

        {saleStatus.status === "start" && (
          <div className="flex flex-col my-4 zui-text-1">
            <p className="uppercase tracking-wide text-zui-yellow font-semibold">
              Sale starting{" "}
              {saleStatus.nextStatusStartTime > 0 ? "in:" : "soon."}
            </p>
            {saleStatus.nextStatusStartTime > 0 && (
              <Timer eta={saleStatus.nextStatusStartTime} />
            )}
          </div>
        )}

        <div className="flex landscape:space-x-4 items-center portrait:flex-col portrait:items-stretch">
          {isConnected ? (
            saleStatus.status !== "start" ? (
              mintStatus.canMint === true ? (
                insufficientBalance ? (
                  <button
                    id="btn-low-balance"
                    className="flex-1 flex mt-4 bg-zui-white items-stretch divide-x-2 divide-black cursor-not-allowed"
                  >
                    <span className="whitespace-nowrap px-8 py-4 flex-1 text-zui-dark flex items-center justify-center font-semibold">
                      Low Balance
                    </span>
                    <div className="flex flex-col items-start flex-shrink-0 justify-center px-2 py-2">
                      <span className="whitespace-nowrap text-zui-dark text-xs font-bold uppercase tracking-wide">
                        Price
                      </span>
                      <span className="whitespace-nowrap text-zui-dark leading-none">
                        {formatEther(BigInt(String(pricePerMint)))} ETH
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    id="btn-buy-now"
                    className="flex-1 flex mt-4 bg-zui-white items-stretch divide-x-2 divide-black"
                    onClick={handleMint}
                  >
                    <span className="whitespace-nowrap px-8 py-4 flex-1 text-zui-dark flex items-center justify-center font-semibold">
                      Buy Now
                    </span>
                    <div className="flex flex-col items-start flex-shrink-0 justify-center px-2 py-2">
                      <span className="whitespace-nowrap text-zui-dark text-xs font-bold uppercase tracking-wide">
                        Price
                      </span>
                      <span className="whitespace-nowrap text-zui-dark leading-none">
                        {formatEther(BigInt(String(pricePerMint)))} ETH
                      </span>
                    </div>
                  </button>
                )
              ) : mintStatus.canMint === null && tokenId != null ? (
                <button
                  key="btn-view-nft"
                  className="flex-1 flex mt-4 bg-zui-white items-stretch divide-x-2 divide-black"
                  onClick={openNFT}
                >
                  <span className="whitespace-nowrap w-full px-8 py-4 text-zui-dark flex items-center justify-center font-semibold">
                    View NFT
                  </span>
                </button>
              ) : mintStatus.canMint === "minting" ? (
                <button
                  key="btn-view-trans"
                  className="flex-1 flex mt-4 bg-zui-white items-stretch divide-x-2 divide-black"
                  onClick={openTransaction}
                >
                  <span className="whitespace-nowrap w-full flex-1 px-8 py-4 text-zui-dark flex items-center justify-center font-semibold">
                    View transaction
                  </span>
                </button>
              ) : (
                !(
                  isPending ||
                  isConfirming ||
                  isConfirmed ||
                  Number(mintsAllowed) === 0
                ) && (
                  <button
                    key="btn-add-whitelist"
                    className="flex-1 flex mt-4 bg-zui-white items-stretch divide-x-2 divide-black"
                    onClick={showWhitelistModal}
                  >
                    <span className="whitespace-nowrap w-full flex-1 px-8 py-4 text-zui-dark flex items-center justify-center font-semibold">
                      Apply for Whitelist
                    </span>
                  </button>
                )
              )
            ) : (
              <></>
            )
          ) : (
            <button
              key="btn-connect-wallet"
              className="flex-1 flex mt-4 bg-zui-white items-stretch divide-x-2 divide-black"
              onClick={openConnectModal}
            >
              <span className="whitespace-nowrap px-8 py-4 w-full text-zui-dark flex items-center justify-center font-semibold">
                Connect Wallet
              </span>
            </button>
          )}
          {!(isPending || isConfirming || isConfirmed) && (
            <div className="flex-1 flex">
              <OpenSeaButton />
            </div>
          )}
        </div>
      </div>
      <WhitelistModal
        isOpen={isWhitelistModalOpen}
        onClose={hideWhitelistModal}
      />
    </div>
  );
};

const OpenSeaButton = () => {
  const { data: floorPrice } = useQueryApi<string | number>(
    "WEBTHREE_FOUNDER_MARKETPLACE_LISTINGS",
    {
      enabled: true,
      select: (data) => {
        const price = data.data?.listings?.[0]?.price?.current;
        if (price) {
          return Number(formatEther(BigInt(String(price.value)))).toFixed(2);
        }
        return 0;
      },
      refetchOnWindowFocus: false,
    }
  );

  const openOpensea = () => {
    window.open("https://opensea.io/collection/founders-of-zo-world", "_blank");
  };

  return (
    <button
      key="btn-buy-on-opensea"
      className="flex-1 flex mt-4 border-zui-white border-2 items-stretch divide-x-2 divide-zui-white"
      onClick={openOpensea}
    >
      <span className="whitespace-nowrap px-8 py-4 flex-1 text-zui-white flex items-center justify-center font-semibold">
        Buy on Opensea
      </span>
      <div className="flex flex-col items-start flex-shrink-0 justify-center px-2 py-2">
        <span className="whitespace-nowrap text-zui-white text-xs font-bold uppercase tracking-wide">
          Floor
        </span>
        <span className="whitespace-nowrap text-zui-white leading-none">
          {floorPrice} ETH
        </span>
      </div>
    </button>
  );
};

export default Mint;
