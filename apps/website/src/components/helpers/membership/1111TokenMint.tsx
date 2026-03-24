/* eslint-disable @typescript-eslint/no-explicit-any */
import { useConnectModal } from "@rainbow-me/rainbowkit";
import Icon from "@zo/assets/icons";
import { isValidObject } from "@zo/utils/object";
import { token1110Prod } from "apps/website/src/abis";
import React, { useMemo } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const contractConfig: any = {
  address: token1110Prod.address,
  abi: token1110Prod.abi,
  chainId: token1110Prod.meta.CHAIN_ID,
};

interface TokenMintProps {}

const TokenMint: React.FC<TokenMintProps> = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const { openConnectModal } = useConnectModal();

  const { data: available } = useReadContract({
    ...contractConfig,
    functionName: "available",
  });

  const { data: pricePerMint } = useReadContract({
    ...contractConfig,
    functionName: "pricePerMint",
  });

  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const {
    data,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const hasInsufficientBalance = useMemo(
    () =>
      pricePerMint != null
        ? BigInt(balance?.value || 0) < BigInt(String(pricePerMint))
        : true,
    [balance?.value, pricePerMint]
  );

  const mintStatus = useMemo(() => {
    if (isPending) {
      return {
        status: "waiting",
        reason: "Waiting for approval...",
      };
    }
    if (isConfirming) {
      return {
        status: "minting",
        reason: "Please Wait...",
      };
    }
    if (isConfirmed) {
      return {
        status: null,
        reason: "Zo Zo Zo! You are the 1/1.",
      };
    } else {
      return {
        status: "mintable",
        reason: null,
      };
    }
  }, [isConfirming, isConfirmed, isPending]);

  const handleMint = () => {
    writeContract({
      ...contractConfig,
      functionName: "mint",
      value: pricePerMint ? BigInt(String(pricePerMint)) : BigInt(0),
    });
  };

  const openNFT = () => {
    window.open(
      `https://opensea.io/assets/ethereum/0xf9e631014ce1759d9b76ce074d496c3da633ba12/1110`,
      "_blank"
    );
  };

  const openTransaction = () => {
    if (hash) {
      window.open(`https://etherscan.io/tx/${hash}`, "_blank");
    }
  };

  return (
    <div className="flex flex-col items-start mt-48 justify-start portrait:w-full">
      <div className="flex flex-col text-zui-dark w-full transition-all ease-in-out duration-200">
        <h2 className="text-zui-white font-bold zui-heading-1">
          Exclusive 1/1 NFT
        </h2>
        <p className="zui-heading-2 text-zui-white mt-2">
          Get the most exclusive NFT from the Founder Collection and be a part
          of the Zo World NYCxZo property.
        </p>
        <video
          autoPlay
          className="object-contain mt-20 w-full h-80 bg-black"
          controls={false}
          controlsList="nodownload"
          loop
          playsInline
          poster="https://i.seadn.io/gcs/files/8b57eee01ead7ed246c23acf97d73c8a.gif?w=500&auto=format"
          preload="metadata"
        >
          <source
            src="https://openseauserdata.com/files/d3a4c270d5a0e383805342d81f80ce92.mp4#t=0.001"
            type="video/mp4"
          />
        </video>
        <div className="flex flex-col -mt-[60px]">
          {isConfirmed ? (
            <div
              className={`text-[3vh] portrait:text-[4.4vw] relative flex items-center text-zui-green space-x-[1vh] mb-[2vh] transition-all ease-in-out duration-200 ${
                mintStatus.reason != null ? "opacity-100" : "opacity-0"
              }`}
            >
              <i className="uil text-[4vh] portrait:text-[6vw] uil-spinner text-zui-green" />
              <span>{mintStatus.reason || "Zo Zo Zo"}</span>
            </div>
          ) : (
            <div
              className={`text-[3vh] portrait:text-[4.4vw] relative flex items-center text-zui-yellow space-x-[1vh] mb-[2vh] transition-all ease-in-out duration-200 ${
                mintStatus.reason != null ? "opacity-100" : "opacity-0"
              }`}
            >
              <i className="uil text-[4vh] portrait:text-[6vw] uil-spinner text-zui-yellow" />
              <span>{mintStatus.reason || "Zo Zo Zo"}</span>
            </div>
          )}
          <div className="flex w-full portrait:flex-col portrait:w-full items-center landscape:space-x-[15vh] relative justify-between">
            {available ? (
              !isConnected ? (
                <button
                  className="flex-1 flex items-center bg-zui-neon text-zui-dark px-6 py-4 w-full lg:px-20 lg:py-12 zui-heading-2 !font-medium"
                  onClick={openConnectModal}
                >
                  <span className="flex flex-1 items-start flex-col space-y-2">
                    <span className="whitespace-nowrap">
                      Connect Wallet to buy
                    </span>
                    <span className="zui-text-1">Price 111 ETH</span>
                  </span>
                  <Icon name="ArrowRight" size={40} fill="#121212" />
                </button>
              ) : hasInsufficientBalance ? (
                <button
                  className="flex-1 flex items-center bg-zui-neon text-zui-dark px-6 py-4 w-full lg:px-20 lg:py-12 zui-heading-2 !font-medium"
                  disabled
                >
                  <span className="flex flex-1 items-start flex-col space-y-2">
                    <span className="whitespace-nowrap">
                      Insufficient Funds
                    </span>
                    <span className="zui-text-1">Price 111 ETH</span>
                  </span>
                </button>
              ) : mintStatus.status === "mintable" ? (
                <button
                  className="flex-1 flex items-center bg-zui-neon text-zui-dark px-6 py-4 w-full lg:px-20 lg:py-12 zui-heading-2 !font-medium"
                  onClick={handleMint}
                >
                  <span className="flex flex-1 items-start flex-col space-y-2">
                    <span className="whitespace-nowrap">Buy Now</span>
                    <span className="zui-text-1">Price 111 ETH</span>
                  </span>
                  <Icon name="ArrowRight" size={40} fill="#121212" />
                </button>
              ) : mintStatus.status === "waiting" ? (
                <button
                  className="flex-1 flex items-center bg-zui-neon text-zui-dark px-6 py-4 w-full lg:px-20 lg:py-12 zui-heading-2 !font-medium"
                  onClick={handleMint}
                >
                  <span className="flex flex-1 items-start flex-col space-y-2">
                    <span className="whitespace-nowrap">Buy Now</span>
                    <span className="zui-text-1">Price 111 ETH</span>
                  </span>
                  <Icon name="ArrowRight" size={40} fill="#121212" />
                </button>
              ) : mintStatus.status === "minting" ? (
                <button
                  className="flex-1 flex items-center bg-zui-neon text-zui-dark px-6 py-4 w-full lg:px-20 lg:py-12 zui-heading-2 !font-medium"
                  onClick={openTransaction}
                >
                  <span className="flex flex-1 items-start flex-col space-y-2">
                    <span className="whitespace-nowrap">View Transaction</span>
                    <span className="zui-text-1">Price 111 ETH</span>
                  </span>
                  <Icon name="ArrowRight" size={40} fill="#121212" />
                </button>
              ) : mintStatus.status === null ? (
                <button
                  className="flex-1 flex items-center bg-zui-green text-zui-dark px-6 py-4 w-full lg:px-20 lg:py-12 zui-heading-2 !font-medium"
                  onClick={openNFT}
                >
                  <span className="flex flex-1 items-start flex-col space-y-2">
                    <span className="whitespace-nowrap">Open NFT</span>
                    <span className="zui-text-1">Price 111 ETH</span>
                  </span>
                  <Icon name="ArrowRight" size={40} fill="#121212" />
                </button>
              ) : (
                <div className="flex-1 flex items-center bg-zui-green text-zui-dark px-6 py-4 w-full lg:px-20 lg:py-12 zui-heading-2 !font-medium">
                  <div className="flex flex-1 items-start flex-col space-y-2">
                    <span className="whitespace-nowrap">SOLD OUT</span>
                  </div>
                  <Icon name="ArrowRight" size={40} fill="#121212" />
                </div>
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenMint;
