/* eslint-disable @typescript-eslint/no-empty-interface */
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAuth, useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import { formatAddress, isSameAddress } from "@zo/utils/web3";
import moment from "moment";
import { FC, useEffect, useRef, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { primarySorter } from "../../utils";
import { DelegateWalletModal, WalletConnectModal } from "../modals";

interface ConnectedWalletsProps {}

const ConnectedWallets: FC<ConnectedWalletsProps> = () => {
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
  const [isDelegateCashWallet, setDelegateCashWallet] =
    useState<boolean>(false);
  const [isAddingWallet, setAddingWallet] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const isAddingInProgress = useRef<boolean>(false);

  useEffect(() => {
    if (
      address &&
      userWallets?.data &&
      (userWallets?.data.web3_wallets || []).find((wallet: GeneralObject) =>
        isSameAddress(wallet.wallet_address, address)
      ) == null
    ) {
      if (isAddingInProgress.current) {
        setAddingWallet(true);
        setConnectModalVisible(true);
      }
    }

    if (
      address &&
      userWallets?.data &&
      isValidObject(
        (userWallets?.data.web3_wallets || []).find((wallet: GeneralObject) =>
          isSameAddress(wallet.wallet_address, address)
        )
      ) &&
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
    disconnect();
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handleConnectModalClose = () => {
    setConnectModalVisible(false);
    setDelegateCashWallet(false);
    disconnect();
    isAddingInProgress.current = false;
    setAddingWallet(false);
  };

  return (
    <div className="w-full bg-zui-violet flex flex-col overflow-hidden text-zui-white p-4 h-[500px] md:h-[420px] mt-4 md:mt-0">
      <h3 className="flex-shrink-0 font-bold text-5xl">Connected Wallets</h3>
      <div className="w-full flex flex-1 mt-4 overflow-y-auto flex-col space-y-4">
        {(userWallets?.data.web3_wallets || [])
          .sort(primarySorter)
          .map((wallet: GeneralObject) => (
            <WalletCard
              key={wallet.wallet_address}
              wallet={wallet}
              refetch={refetch}
            />
          ))}
      </div>
      <div className="flex flex-col md:flex-row flex-shrink-0 space-y-4 md:space-y-0 md:space-x-4 mt-4">
        <button
          className="flex-shrink-0 flex items-center space-x-2"
          onClick={handleAddWallet}
          disabled={isAddingWallet}
        >
          {isAddingWallet ? (
            <span className="font-semibold">Please Wait...</span>
          ) : (
            <>
              <i className="uil uil-plus" />
              <span className="font-semibold">Add Wallet</span>
            </>
          )}
        </button>
        <button
          className="flex-shrink-0 flex items-center space-x-2"
          onClick={setDelegateCashWallet.bind(null, true)}
        >
          <i className="uil uil-plus" />
          <span className="font-semibold">Add Delegate.cash wallet</span>
        </button>
      </div>
      {isConnectModalVisible && (
        <WalletConnectModal
          close={() => {
            handleConnectModalClose();
            refetch();
          }}
          refetch={refetch}
          setError={setError}
        />
      )}

      {isDelegateCashWallet && (
        <DelegateWalletModal
          close={handleConnectModalClose}
          refetch={refetch}
        />
      )}

      {error !== "" && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 p-4 flex items-center justify-center">
          <div className="absolute inset-0" onClick={setError.bind(null, "")} />
          <div className="bg-black p-4 relative max-w-xl w-full">
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
        data: { wallet_address: wallet.wallet_address },
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
        data: { wallet_address: wallet.wallet_address, primary: true },
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
    <div className="flex flex-col relative p-3 w-full border-2 border-zui-black">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {wallet?.primary && (
            <span className="text-xs font-semibold uppercase bg-zui-magenta text-zui-black p-2">
              primary
            </span>
          )}
          {wallet?.verified && (
            <span className="text-xs font-semibold uppercase bg-zui-green text-zui-black p-2">
              verified
            </span>
          )}
        </div>
        {!wallet?.primary && (
          <>
            <button
              className="w-8 h-8 hover:border-zui-black active:bg-black focus:border-zui-black border-2 border-zui-violet active:text-zui-white flex items-center justify-center"
              onClick={toggleDropDown}
            >
              <i className="uil uil-ellipsis-v text-xl" />
            </button>
            {isDropdownVisible && (
              <ul className="absolute z-10 top-[12px] right-[12px] bg-black flex flex-col items-start divide-y divide-zui-white border border-zui-white">
                <li
                  className="p-2 pr-8 whitespace-nowrap text-zui-white w-full flex items-center justify-start cursor-pointer"
                  onClick={handleSetPrimary}
                >
                  Make Primary
                </li>
                <li
                  className="p-2 pr-8 whitespace-nowrap w-full flex items-center justify-start cursor-pointer text-zui-red"
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
          <span className="">{formatAddress(wallet?.wallet_address)}</span>
          <span className="text-sm">
            Connected on {moment(wallet?.created_at).format("LLL")}
          </span>
        </div>
      </div>
      {isDropdownVisible && (
        <div className="fixed inset-0" onClick={toggleDropDown} />
      )}
    </div>
  );
};
export default ConnectedWallets;
