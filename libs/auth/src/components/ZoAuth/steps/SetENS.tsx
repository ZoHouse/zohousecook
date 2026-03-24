/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from "react";
import useMutationApi from "../../../hooks/useMutationApi";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";
import { ZoAuthStepProps } from "../ZoAuth";

const SetENS: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const { profile, refetchProfile } = useProfile();
  const [selectedENS, setSelectedENS] = useState<string | null>(null);

  const { mutate: updateEns } = useMutationApi("PROFILE_ME_ENS");

  useEffect(() => {
    if (profile) {
      if (profile.ens_nickname) {
        setSelectedENS(profile.ens_nickname);
      }
    }
  }, [profile]);

  const updateENS = async () => {
    await updateEns(
      {
        data: { ens_nickname: selectedENS },
      },
      {
        onSuccess: () => {
          refetchProfile();
          setStep("ONBOARDING_CHECK");
        },
      }
    );
  };

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

  return (
    <div className="flex flex-1 flex-col items-start w-full overflow-hidden">
      {isFetchingENSOwnedData ? (
        <>
          <span className="text-xl text-start">Please Wait</span>
          <span className="text-sm mt-2">Fetching your blocks...</span>
        </>
      ) : (
        <>
          <h4 className="text-xl text-start">Choose your ENS Nickname</h4>
          <div className="w-full mt-4 flex-1 overflow-hidden flex flex-col">
            <ul className="w-full flex flex-col items-start space-y-4 overflow-y-auto ">
              {ensOwnedData?.data.results.map((ens: any) => (
                <li
                  key={ens.token_id}
                  className={`flex items-center w-full cursor-pointer p-3 ${
                    ens.metadata.name === selectedENS
                      ? "bg-zui-pink"
                      : "bg-zinc-800"
                  }`}
                  onClick={setSelectedENS.bind(null, ens.metadata.name)}
                >
                  {ens.metadata.name === selectedENS ? (
                    <i className="uil uil-check-circle pr-3" />
                  ) : (
                    <i className="uil uil-circle pr-3" />
                  )}
                  {ens.metadata.name}
                </li>
              ))}
            </ul>
            <div className="flex items-start flex-col my-4 flex-shrink-0">
              <button
                className="flex px-8 py-4 bg-zui-white text-zui-dark"
                disabled={selectedENS === profile?.ens_nickname}
                onClick={updateENS}
              >
                Update
              </button>
              <span className="text-sm">
                Have more ENSs?{" "}
                <button
                  className="underline mt-2 font-semibold"
                  onClick={setStep.bind(null, "WALLET_ADDITION")}
                >
                  Add another Wallet
                </button>
              </span>
            </div>
          </div>
        </>
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

export default SetENS;
