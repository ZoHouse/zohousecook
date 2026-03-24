import { useConnectModal } from "@rainbow-me/rainbowkit";
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { useResponseFlash } from "@zo/utils/hooks";
import { copyTextToClipboard, isValidString } from "@zo/utils/string";
import { erc20 } from "apps/payment/src/abis";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAccount,
  useBalance,
  useReadContract,
  useSendTransaction,
  useSignMessage,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useAuth } from "../components/auth";
import { PaymentDetails, TransactionHashDisplay } from "../components/ui";

const NATIVE_TOKEN_CHAIN_ID = 1;

interface PaymentTransferProps {}

const PaymentTransfer: React.FC<PaymentTransferProps> = () => {
  const [copied, setCopied] = useResponseFlash(2000);
  const { login, logout, updateWalletConnected, walletConnected } = useAuth();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { signMessage } = useSignMessage();
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
  });
  const router = useRouter();
  const { id } = router.query;

  const { data: paymentData } = useQueryApi<any>(
    "CREAM_PAYMENTS",
    {
      enabled: id !== undefined,
      select: (data) => data.data,
    },
    `${id}/`,
    ""
  );

  const { mutate: updatePayment } = useMutationApi(
    "CREAM_PAYMENTS",
    {},
    `${id}/`,
    "PUT"
  );

  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    if (!isConnected) {
      updateWalletConnected && updateWalletConnected(isConnected);
    }
  }, [isConnected]);
  const { data: hashNative, sendTransaction } = useSendTransaction();

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const {
    data,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: hash || hashNative,
  });

  const { data: price } = useReadContract({
    address: paymentData?.token?.contract_ref_address,
    abi: erc20.abi,
    chainId: paymentData?.token?.chain?.ref_id
      ? parseInt(paymentData.token.chain.ref_id)
      : NATIVE_TOKEN_CHAIN_ID,
    functionName: "balanceOf",
    args: [address],
  });

  const hasInsufficientBalance = useMemo(() => {
    if (paymentData && price) {
      const priceToCompare =
        paymentData?.token?.contract_ref_address === ""
          ? paymentData?.amount
          : price;
      return (balance?.value || 0) <= priceToCompare;
    }
  }, [balance?.value, price, paymentData]);

  const transactionStatus = useMemo(() => {
    if (isPending) {
      return {
        status: "waiting",
        reason: "Waiting for approval...",
      };
    }
    if (isConfirming) {
      return {
        status: "transferring",
        reason: "Please Wait...",
      };
    }
    if (isConfirmed) {
      return {
        status: null,
        reason: "Zo Zo Zo",
      };
    } else {
      return {
        status: "transferable",
        reason: null,
      };
    }
  }, [isConfirming, isConfirmed, isPending]);

  const sign = useCallback(async () => {
    try {
      await signMessage(
        { message: "Welcome To Zo World!" },
        {
          onSuccess: (signature) => {
            if (signature) {
              login(address, "Welcome To Zo World!", signature);
              setIsSignedIn(true);
            }
          },
        }
      );
    } catch (error) {
      console.error("Error signing message:", error);
    }
  }, [signMessage, address, login]);

  const handleSwitchNetwork = useCallback(async () => {
    if (chainId !== paymentData?.token?.chain?.ref_id) {
      try {
        const result = await switchChain({
          chainId: paymentData?.token?.chain?.ref_id,
        });
      } catch (error) {
        console.error("Failed to switch network:", error);
      }
    } else {
      console.log("No chain ID found in payment data");
    }
  }, [signMessage, address, login]);

  const handleTransfer = useCallback(() => {
    if (paymentData) {
      if (paymentData.token.contract_ref_address === "") {
        sendTransaction({
          to: paymentData?.to_address,
          value: BigInt(paymentData?.amount),
        });
      } else {
        writeContract({
          address: paymentData.token.contract_ref_address,
          abi: erc20.abi,
          chainId: paymentData?.token?.chain?.ref_id,
          functionName: "transfer",
          args: [paymentData.to_address, BigInt(paymentData.amount)],
        });
      }
    }
  }, [paymentData, sendTransaction, writeContract]);

  const handleButtonClick = useCallback(async () => {
    if (!isSignedIn) {
      await sign();
      await handleSwitchNetwork();
    }

    handleTransfer();
  }, [isSignedIn, sign, handleSwitchNetwork, handleTransfer]);

  useEffect(() => {
    if (hash || hashNative) {
      updatePayment(
        {
          data: {
            transaction_hash: hash || hashNative,
          },
        },
        {
          onSuccess() {
            toast("Payment updated");
          },
          onError() {
            toast.error("Failed! Try Again");
          },
        }
      );
    }
  }, [hash || hashNative, updatePayment]);

  const openTransaction = () => {
    const transactionHash =
      hash || hashNative || paymentData?.transaction?.transaction_hash;
    if (transactionHash) {
      window.open(
        `${paymentData?.token?.chain?.block_explorer_url}/tx/${transactionHash}`,
        "_blank"
      );
    }
  };

  const handlePaymentHistory = useCallback(async () => {
    if (!isSignedIn) {
      await sign();
      setTimeout(() => {
        router.push("/details");
      }, 2000);
    } else {
      router.push("/details");
    }
  }, [isSignedIn, sign]);

  const transactionHash =
    hash || hashNative || paymentData?.transaction?.transaction_hash;
  return (
    <div className="flex flex-col items-center mt-28 justify-start w-full space-y-6">
      <div className="flex justify-end w-full space-x-4 p-6">
        <button
          className={`flex items-center ${
            !isConnected ? "bg-zui-neon " : "bg-zui-white "
          } text-zui-dark px-4 py-2 shadow-xl transition-all hover:scale-105`}
          onClick={!isConnected ? openConnectModal : handlePaymentHistory}
        >
          <span className="text-left">
            {!isConnected ? "Connect Wallet" : "Payment History"}
          </span>
          <Icon name="ArrowRight" size={24} fill="#" />
        </button>
      </div>
      <div className="flex flex-col text-zui-white w-[580px] transition-all ease-in-out duration-200 p-6 bg-gradient-to-r from-zui-lighter to-zui-light shadow-2xl">
        <h2 className="text-zui-white font-bold text-2xl mb-4">Payment</h2>
        {paymentData && <PaymentDetails paymentData={paymentData} />}
        <TransactionHashDisplay hash={transactionHash} />
        {isConnected && (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex w-full flex-col items-center space-y-4">
              {hasInsufficientBalance && paymentData?.status !== "success" ? (
                <button
                  onClick={openTransaction}
                  className="px-4 py-2 bg-zui-red text-zui-white  shadow-lg"
                >
                  Insufficient Funds
                </button>
              ) : transactionStatus.status === "transferable" &&
                paymentData?.status !== "success" ? (
                <button
                  className="w-full max-w-xs mt-4 flex items-center bg-zui-white text-zui-dark px-4 py-2 shadow-xl transition-all hover:scale-105"
                  onClick={handleButtonClick}
                >
                  <span className="flex-1 text-left">Send Now</span>
                  <Icon name="ArrowRight" size={24} fill="#121212" />
                </button>
              ) : transactionStatus.status === "waiting" ? (
                <button className="w-full max-w-xs flex items-center bg-zui-yellow to-yellow-600 text-zui-white px-4 py-2 shadow-xl">
                  <span className="flex-1 text-left">Wait</span>
                  <Icon name="ArrowRight" size={24} fill="#121212" />
                  <div className="flex h-full w-full justify-center items-center">
                    <Loader className="h-10 w-10" />
                  </div>
                </button>
              ) : transactionStatus.status === "transferring" ? (
                <>
                  <button
                    className="w-full max-w-xs flex items-center bg-zui-blue text-zui-white px-4 py-2 shadow-xl transition-all hover:scale-105"
                    onClick={openTransaction}
                  >
                    <span className="flex-1 text-left">Transferring</span>
                    <Icon name="ArrowRight" size={24} fill="#ffffff" />
                    <div className="flex h-full w-full justify-center items-center">
                      <Loader className="h-10 w-10" />
                    </div>
                  </button>
                </>
              ) : (
                <button
                  onClick={openTransaction}
                  className="px-4 py-2 bg-zui-white text-zui-dark rounded shadow-lg"
                >
                  Show Details
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTransfer;
