import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { joinZoProd } from "../abis";

const joinZoContract: any = joinZoProd;

type ContractSaleStatusText = "start" | "pre" | "public" | "end";

type ContractSaleStatus = {
  status: ContractSaleStatusText;
  hasEnded: boolean;
  nextStatus: ContractSaleStatusText;
  nextStatusStartTime: number;
};

const initialSaleStatus: ContractSaleStatus = {
  status: "start",
  hasEnded: false,
  nextStatus: "pre",
  nextStatusStartTime: 0,
};

const contractConfig = {
  address: joinZoContract.address,
  abi: joinZoContract.abi,
  chainId: joinZoContract.meta.CHAIN_ID,
};

const useJoinZoContract = () => {
  const [supplyLeft, setSupplyLeft] = useState<number>(0);
  const [saleStatus, setSaleStatus] =
    useState<ContractSaleStatus>(initialSaleStatus);

  const { data: availableData } = useReadContract({
    ...contractConfig,
    functionName: "available",
  });
  const { data: mintStartData } = useReadContract({
    ...contractConfig,
    functionName: "mintStart",
  });
  const { data: publicMintStartData } = useReadContract({
    ...contractConfig,
    functionName: "publicMintStart",
  });

  useEffect(() => {
    if (
      availableData != null &&
      mintStartData != null &&
      publicMintStartData != null
    ) {
      setSupplyLeft(Number(availableData));
      setSaleStatus(
        getSaleStatus(
          Number(mintStartData),
          Number(publicMintStartData),
          Number(availableData)
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableData, mintStartData, publicMintStartData]);

  const getSaleStatus = (
    mintStart: number,
    publicMintStart: number,
    supplyLeft: number
  ) => {
    const status: ContractSaleStatus = initialSaleStatus;

    const currentEpoch = +new Date() / 1000;

    if (mintStart > 0) {
      // Pre sale announced
      if (currentEpoch >= mintStart) {
        // Post or during pre-sale
        if (publicMintStart > 0) {
          // Public sale announced
          if (currentEpoch >= publicMintStart) {
            // During or Post public sale
            if (supplyLeft > 0) {
              // During Public Sale
              status.status = "public";
              status.hasEnded = false;
              status.nextStatus = "end";
              status.nextStatusStartTime = 0;
            } else {
              // All Sold
              status.status = "end";
              status.hasEnded = true;
              status.nextStatus = "end";
              status.nextStatusStartTime = 0;
            }
          } else {
            // post or during pre sale when public sale announced
            status.status = "pre";
            status.nextStatus = "public";
            status.nextStatusStartTime = publicMintStart;
            if (supplyLeft > 0) {
              // During Pre Sale and stock left
              status.hasEnded = false;
            } else {
              // Pre Sale over
              status.hasEnded = true;
            }
          }
        } else {
          // post or during pre sale when public sale not announced
          status.status = "pre";
          status.nextStatus = "public";
          status.nextStatusStartTime = 0;
          if (supplyLeft > 0) {
            // During Pre Sale and stock left
            status.hasEnded = false;
          } else {
            // Pre Sale over
            status.hasEnded = true;
          }
        }
      } else {
        // Pre pre sale
        status.status = "start";
        status.hasEnded = false;
        status.nextStatus = "pre";
        status.nextStatusStartTime = mintStart;
      }
    } else {
      // Pre sale not announced
      status.status = "start";
      status.hasEnded = false;
      status.nextStatus = "pre";
      status.nextStatusStartTime = 0;
    }

    return status;
  };

  return {
    saleStatus,
    supplyLeft,
    contractConfig,
  };
};

export default useJoinZoContract;
