import { useMutationApi, useProfile } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useInitialTimeout, useVisibilityState } from "@zo/utils/hooks";
import { formatAddress } from "@zo/utils/web3";
import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import { auth } from "../../config";
import MergeAccountModal from "./MergeAccountModal";

interface WalletConnectModalProps {
  close: () => void;
  refetch: () => void;
  setError: Dispatch<SetStateAction<string>>;
}
const WalletConnectModal: FC<WalletConnectModalProps> = ({
  close,
  refetch,
  setError,
}) => {
  const { refetchProfile } = useProfile();

  const { address, isConnected } = useAccount();

  const { signMessage } = useSignMessage();
  const { mutate: addWallet, data } = useMutationApi(
    "AUTH_USER_WEB3_WALLETS",
    {}
  );

  const isReady = useInitialTimeout(3000);

  const [isSigned, setSigned] = useState<boolean>(false);
  const [mergeData, setMergeData] = useState<GeneralObject>({});
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const [isMergeModalOpen, showMergeModal, hideMergeModal] =
    useVisibilityState(false);

  useEffect(() => {
    if (data && (data.status === 201 || data.status === 200)) {
      refetch();
      refetchProfile();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, data, refetch]);

  const sign = useCallback(async () => {
    await signMessage(
      {
        message: auth.AUTH_SIGNATURE_TEXT,
      },
      {
        onSuccess: (signature: string) => {
          if (signature) {
            setSigned(true);
            addWallet(
              {
                data: {
                  wallet_address: address,
                  message: auth.AUTH_SIGNATURE_TEXT,
                  signature: signature,
                },
              },
              {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                  setIsSuccess(false);
                  if (error?.response?.status === 409) {
                    showMergeModal();

                    setMergeData({
                      mergeId: error.response.data.merge_id,
                      authData: {
                        wallet_address: address,
                        message: auth.AUTH_SIGNATURE_TEXT,
                        signature: signature,
                      },
                      profile: error.response.data.merge_with,
                    });
                  } else {
                    close();
                    if (error.response.status === 400) {
                      setError(
                        error?.response?.data?.errors?.join(" ") ||
                          "Something went wrong."
                      );
                    }
                    setError("Something went wrong.");
                  }
                },
                onSuccess: () => {
                  setIsSuccess(true);
                },
              }
            );
          }
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addWallet, address, signMessage]);

  useEffect(() => {
    if (address && !isSigned) {
      setTimeout(async () => {
        await sign();
      }, 2000);
    }
  }, [address, isSigned, sign]);

  return (
    <>
      {" "}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center">
        <div className="absolute inset-0" onClick={close} />
        <div className="bg-black p-4 relative">
          <div className="flex flex-1 flex-col items-start">
            <div className="flex items-center justify-between w-full">
              <span className="text-xl text-start">
                Wallet Connection Status
              </span>
              <button
                className="w-8 h-8 flex items-center justify-center cursor-pointer"
                onClick={close}
              >
                <i className="uil uil-times text-xl" />
              </button>
            </div>

            <div className="flex flex-col space-y-4 mt-8">
              {!isConnected ? (
                <div className="flex items-center space-x-4">
                  <i className="uil uil-spinner-alt animate-spin" />
                  <span className="">Connecting to the wallet</span>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <i className="uil uil-check-circle" />
                  <span className="">
                    Connected to{" "}
                    <strong>{address && formatAddress(address)}</strong>
                  </span>
                </div>
              )}
              {!isSigned ? (
                <div className="flex items-center space-x-4">
                  <i className="uil uil-spinner-alt animate-spin" />
                  <span className="">Waiting for sign</span>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <i className="uil uil-check-circle" />
                  <span className="">Signed</span>
                </div>
              )}
              {!isSuccess ? (
                <div className="flex items-center space-x-4">
                  <i className="uil uil-spinner-alt animate-spin" />
                  <span className="">Waiting to verify</span>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <i className="uil uil-check-circle" />
                  <span className="">Verified</span>
                </div>
              )}
            </div>
            {isReady && !isSigned && (
              <span className="text-sm mt-8">
                Issue in signing?{" "}
                <button className="underline font-bold" onClick={sign}>
                  Click here to sign manually
                </button>
              </span>
            )}

            <span className="text-sm mt-12">
              In case of any issue, raise a ticket on{" "}
              <a
                className="underline font-semibold hover:text-zui-magenta cursor-pointer"
                href="https://discord.gg/thezoworld"
                rel="noreferrer"
                target="_blank"
              >
                our discord
              </a>
              .
            </span>
          </div>
        </div>
      </div>
      {isMergeModalOpen && (
        <MergeAccountModal
          isOpen={isMergeModalOpen}
          onClose={() => {
            hideMergeModal();
            close();
          }}
          mergeId={mergeData.mergeId}
          authData={mergeData.authData}
          mergingProfile={mergeData.profile}
          type="web3"
          onSuccess={refetchProfile}
        />
      )}
    </>
  );
};

export default WalletConnectModal;
