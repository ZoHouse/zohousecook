/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZoSpinner } from "../ui/ZoSpinner";
import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import React, { useEffect, useState } from "react";
import { Button } from "../common";

interface EnsModalProps {
  close: () => void;
  showWallets: () => void;
}

const EnsModal: React.FC<EnsModalProps> = ({ close, showWallets }) => {
  const { profile, refetchProfile } = useProfile();
  const [selectedENS, setSelectedENS] = useState(profile?.ens_nickname);

  const { data: ensOwnedData, isFetching: isFetchingENSOwnedData } =
    useQueryApi(
      "PROFILE_ME_ENS",
      {
        enabled: profile != null && profile.wallet_address != null,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: false,
      },
      "",
      ""
    );

  const { mutate: updateEns, isLoading: isUpdatingENS } = useMutationApi(
    "PROFILE_ME_ENS",
    {},
    "",
    "POST"
  );

  useEffect(() => {
    if (profile) {
      if (profile.ens_nickname) {
        setSelectedENS(profile.ens_nickname);
      }
    }
  }, [profile]);

  const updateENS = async () => {
    if (selectedENS) {
      updateEns(
        {
          data: { ens_nickname: selectedENS },
        },
        {
          onSuccess: () => {
            refetchProfile();
            close();
          },
        }
      );
    }
  };

  const openENS = () => {
    window.open("https://app.ens.domains/", "_blank");
  };

  return (
    <div className="fixed inset-0 z-20 px-[4vw] bg-zui-white bg-opacity-60 flex items-center justify-center">
      <div className="fixed inset-0" onClick={close} />
      <div className="max-w-xl w-full h-auto max-h-full overflow-y-auto bg-zui-black relative">
        <button
          className="absolute z-10 top-2 right-2 flex items-center bg-zui-white justify-center w-8 h-8 text-zui-white text-xl text-zui-black"
          onClick={close}
        >
          <i className="uil uil-times" />
        </button>
        {isFetchingENSOwnedData ? (
          <div className="flex flex-col items-center justify-center my-24">
            <ZoSpinner size={40} />
            <span className="text-xl mt-4 portrait:text-lg text-zui-white uppercase font-bold">
              Please Wait...
            </span>
            <span className=" text-xl mt-2 font-bold text-zui-magenta leading-none">
              Fetching your ENSs
            </span>
          </div>
        ) : (
          <>
            <h4 className=" flex flex-col font-semibold p-4 leading-none text-zui-magenta text-2xl">
              Select ENS
            </h4>
            {(ensOwnedData?.data.results || []).length > 0 ? (
              <div className="w-full p-4">
                <ul className="w-full flex flex-col items-start space-y-4 max-h-[65vh] overflow-y-auto ">
                  {ensOwnedData?.data.results.map((ens: any) => (
                    <li
                      key={ens.token_id}
                      className={`flex items-center w-full cursor-pointer p-4 ${
                        ens.metadata?.name === selectedENS
                          ? "bg-zui-magenta text-zui-black"
                          : "bg-zinc-800 text-zui-white"
                      }`}
                      onClick={setSelectedENS.bind(null, ens.metadata?.name)}
                    >
                      {ens.metadata?.name === selectedENS ? (
                        <i className="uil uil-check-circle pr-4" />
                      ) : (
                        <i className="uil uil-circle pr-4" />
                      )}
                      {ens.metadata?.name}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center self-start mt-8">
                  <Button
                    fixedsize
                    icon="arrow-right"
                    theme="light"
                    disabled={selectedENS === profile?.ens_nickname}
                    isLoading={isUpdatingENS}
                    onClick={updateENS}
                  >
                    Update
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full p-4">
                <div className="flex flex-1 flex-col items-start">
                  <span className="text-xl text-start">Oh Wait!</span>
                  <span className="mt-2">
                    It looks like you don&apos;t have any ENS in your wallet.
                    Try adding a wallet to your account, which has an ENS.
                  </span>

                  <Button
                    className="mt-4"
                    icon="arrow-right"
                    onClick={showWallets}
                    fixedsize
                    theme="light"
                  >
                    Add Wallet
                  </Button>
                  <button
                    className="mt-4 underline font-medium"
                    onClick={openENS}
                  >
                    Buy ENS
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EnsModal;
