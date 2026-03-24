import { useConnectModal } from "@rainbow-me/rainbowkit";
import { GeneralObject } from "@zo/definitions/general";
import { useInitialTimeout } from "@zo/utils/hooks";
import { formatAddress, isSameAddress } from "@zo/utils/web3";
import moment from "moment";
import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useAuth } from "../../../contexts/auth";
import useMutationApi from "../../../hooks/useMutationApi";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";
import { ZoAuthStepProps } from "../ZoAuth";

const primaryWalletSorter = (a: GeneralObject, b: GeneralObject) => {
  if (a.primary && !b.primary) {
    return -1;
  }
  if (!a.primary && b.primary) {
    return 1;
  }
  return 0;
};

const WalletAddition: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { isLoggedIn } = useAuth();

  const { data: userWallets, refetch } = useQueryApi(
    "AUTH_USER_WEB3_WALLETS",
    { enabled: isLoggedIn === true },
    "",
    ""
  );

  const [isConnectModalVisible, setConnectModalVisible] =
    useState<boolean>(false);
  const [isAddingWallet, setAddingWallet] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const isAddingInProgress = useRef<boolean>(false);

  useEffect(() => {
    if (
      address &&
      userWallets?.data &&
      userWallets?.data.web3_wallets.find((wallet: GeneralObject) =>
        isSameAddress(wallet.wallet_address, address)
      ) == null
    ) {
      console.log(
        address,
        userWallets?.data.web3_wallets,
        userWallets?.data.web3_wallets.find((wallet: GeneralObject) =>
          isSameAddress(wallet.wallet_address, address)
        )
      );
      if (isAddingInProgress.current) {
        setAddingWallet(true);
        setConnectModalVisible(true);
      }
    }

    if (
      address &&
      userWallets?.data &&
      userWallets?.data.web3_wallets.find((wallet: GeneralObject) =>
        isSameAddress(wallet.wallet_address, address)
      ) != null &&
      isAddingInProgress.current
    ) {
      setError(
        `The wallet associated with ${formatAddress(address || "")} is
      already added to your account. Try switching to a different wallet before clicking Add
      Wallet.`
      );
    }
  }, [address, userWallets?.data]);

  useEffect(() => {
    disconnect();
    return () => {
      isAddingInProgress.current = false;
    };
  }, [disconnect]);

  const handleAddWallet = () => {
    isAddingInProgress.current = true;
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handleConnectModalClose = () => {
    setConnectModalVisible(false);
    disconnect();
    isAddingInProgress.current = false;
    setAddingWallet(false);
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full overflow-hidden">
      <span className="text-xl text-start flex-shrink-0">
        Connected Wallets
      </span>
      <div className="w-full flex-1 overflow-hidden flex flex-col">
        <div className="w-full overflow-y-auto flex flex-col">
          {userWallets?.data.web3_wallets
            .sort(primaryWalletSorter)
            .map((wallet: GeneralObject) => (
              <WalletCard
                key={wallet.wallet_address}
                wallet={wallet}
                refetch={refetch}
              />
            ))}
        </div>
        <div className="flex items-start flex-shrink-0 bg-zui-red bg-opacity-70 p-2 text-sm space-x-2 mt-4">
          <i className="uil uil-exclamation-octagon text-2xl" />
          <span>
            Make sure that you switch your wallet before connecting to the
            desired wallet.
          </span>
        </div>
        <button
          className="flex-shrink-0 self-start mt-4 mb-8 flex px-8 py-4 bg-zui-white text-zui-dark"
          onClick={handleAddWallet}
        >
          Add Wallet
        </button>
      </div>
      {isConnectModalVisible && (
        <WalletConnectModal
          close={handleConnectModalClose}
          refetch={refetch}
          setError={setError}
        />
      )}

      {error !== "" && (
        <div className="fixed inset-0 bg-zui-dark bg-opacity-70 z-40 p-4 flex items-center justify-center">
          <div className="absolute inset-0" onClick={setError.bind(null, "")} />
          <div className="bg-zui-dark p-4 relative max-w-xl w-full">
            <div className="flex flex-1 flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <span className="text-xl text-start">Oh no!</span>
                <button
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                  onClick={setError.bind(null, "")}
                >
                  <i className="uil uil-times text-xl" />
                </button>
              </div>
              <p className="mt-4 capitalize">{error}</p>
            </div>
          </div>
        </div>
      )}

      <span className="mt-auto flex-shrink-0 text-sm my-4">
        In case of any issue, raise a ticket on{" "}
        <a
          className="underline font-semibold hover:text-[#7289DA] cursor-pointer"
          href="https://discord.gg/zoworld"
          rel="noreferrer"
          target="_blank"
        >
          our discord
        </a>
        .
      </span>
    </div>
  );
};

const WalletCard: FC<{ wallet: GeneralObject; refetch: () => void }> = ({
  wallet,
  refetch,
}) => {
  const { refetchProfile } = useProfile();

  const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const { mutate: deleteWallet } = useMutationApi(
    "AUTH_USER_WEB3_WALLETS",
    {},
    "",
    "DELETE"
  );
  const { mutate: updateWallet } = useMutationApi(
    "AUTH_USER_WEB3_WALLETS",
    {},
    "",
    "PUT"
  );

  const handleRemoveWallet = () => {
    deleteWallet(
      {
        data: {
          wallet_address: wallet.wallet_address,
        },
      },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };

  const handleSetPrimary = () => {
    updateWallet(
      {
        data: {
          wallet_address: wallet.wallet_address,
          primary: true,
        },
      },
      {
        onSuccess: () => {
          refetch();
          setDropdownVisible(false);
        },
      }
    );
  };

  const toggleDropDown = () => {
    setDropdownVisible((v) => !v);
  };

  return (
    <div className="flex flex-col relative p-3 mt-4 w-full bg-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {wallet.primary && (
            <span className="text-xs font-semibold uppercase bg-zui-pink text-zui-zui-dark p-2">
              primary
            </span>
          )}
          {wallet.verified && (
            <span className="text-xs font-semibold uppercase bg-zui-green text-zui-zui-dark p-2">
              verified
            </span>
          )}
        </div>
        {!wallet.primary && (
          <>
            <button
              className="w-8 h-8 hover:bg-zui-dark active:bg-zui-dark focus:bg-zui-dark flex items-center justify-center"
              onClick={toggleDropDown}
            >
              <i className="uil uil-ellipsis-v text-xl" />
            </button>
            {isDropdownVisible && (
              <ul className="absolute z-10 top-[12px] right-[12px] bg-zinc-700 flex flex-col items-start divide-y divide-zui-zui-dark">
                <li
                  className="p-2 pr-8 whitespace-nowrap w-full flex items-center justify-start cursor-pointer hover:bg-zui-dark"
                  onClick={handleSetPrimary}
                >
                  Make Primary
                </li>
                <li
                  className="p-2 pr-8 whitespace-nowrap w-full flex items-center justify-start cursor-pointer hover:bg-zui-dark text-zui-red"
                  onClick={handleRemoveWallet}
                >
                  Remove
                </li>
              </ul>
            )}
          </>
        )}
      </div>
      <div className="flex items-start">
        <i className="uil uil-wallet text-2xl" />
        <div className="flex flex-col ml-2">
          <span className="">{formatAddress(wallet.wallet_address)}</span>
          <span className="text-sm">
            Connected on {moment(wallet.created_at).format("LLL")}
          </span>
        </div>
      </div>
      {isDropdownVisible && (
        <div className="fixed inset-0" onClick={toggleDropDown} />
      )}
    </div>
  );
};

const WalletConnectModal: FC<{
  close: () => void;
  refetch: () => void;
  setError: Dispatch<SetStateAction<string>>;
}> = ({ close, refetch, setError }) => {
  const { refetchProfile } = useProfile();
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const {
    mutate: addWallet,
    data,
    isSuccess,
  } = useMutationApi("AUTH_USER_WEB3_WALLETS");
  const isReady = useInitialTimeout(3000);
  const [isSigned, setSigned] = useState<boolean>(false);

  useEffect(() => {
    if (data && data.status === 200) {
      refetch();
      refetchProfile();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, data, refetch]);

  const sign = useCallback(async () => {
    await signMessage(
      {
        message: "Welcome To Zo World!",
      },
      {
        onSuccess: (signature: string) => {
          if (signature) {
            setSigned(true);
            addWallet(
              {
                data: {
                  wallet_address: address,
                  message: "Welcome To Zo World!",
                  signature: signature,
                },
              },
              {
                onError: (error: any) => {
                  close();
                  if (error.response.status === 400) {
                    setError(
                      error?.response?.data?.errors?.join(" ") ||
                        "Something went wrong."
                    );
                  }
                  setError("Something went wrong.");
                },
              }
            );
          }
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signMessage]);

  useEffect(() => {
    if (address && !isSigned) {
      setTimeout(async () => {
        await sign();
      }, 2000);
    }
  }, [address, isSigned, sign]);

  return (
    <div className="fixed inset-0 bg-zui-dark bg-opacity-70 z-40 flex items-center justify-center">
      <div className="absolute inset-0" onClick={close} />
      <div className="bg-zui-dark p-4 relative">
        <div className="flex flex-1 flex-col items-start">
          <div className="flex items-center justify-between w-full">
            <span className="text-xl text-start">Wallet Connection Status</span>
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
              href="https://discord.gg/zoworld"
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
  );
};

export default WalletAddition;
