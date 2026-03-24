/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import { FC, useEffect, useState } from "react";
import useMutationApi from "../../../hooks/useMutationApi";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";
import { ZoAuthStepProps } from "../ZoAuth";
import AllowedCollectionModal from "../modals/AllowedCollections";

function groupBy(array: any[], key: string) {
  return array.reduce(function (result, currentValue) {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    );
    return result;
  }, {});
}

const getImageUri = (uri: string) => {
  if (uri) {
    if (uri.startsWith("http")) {
      return uri;
    } else {
      return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    }
  }
  return "";
};

const SetPFP: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("pfp");
  }, [setFocus]);

  const { profile, refetchProfile } = useProfile();
  const [selectedPFP, setSelectedPFP] = useState<GeneralObject | null>(null);
  const [isAllowlistVisible, setAllowlistVisible] = useState<boolean>(false);

  const { data: collectionData } = useQueryApi(
    "SOCIALS_SHOWCASE_COLLECTIONS",
    {
      enabled: profile != null && profile.wallet_address != null,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
    },
    ``,
    ""
  );
  const { mutate: updatePfp } = useMutationApi("PROFILE_ME_PFP");

  const {
    data: pfpOwnedData,
    isFetching: isFetchingPFPOwnedData,
    refetch,
  } = useQueryApi(
    "PROFILE_ME_PFP",
    {
      enabled: profile != null && profile.wallet_address != null,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      select: (data) => {
        const grouped = groupBy(data.data.results, "name");
        return grouped || {};
      },
    },
    ``,
    ""
  );

  const toggleSelectPFP = (pfp: GeneralObject) => {
    if (selectedPFP) {
      if (
        selectedPFP.token_address === pfp.token_address &&
        selectedPFP.token_id === pfp.token_id
      ) {
        setSelectedPFP(null);
      } else {
        setSelectedPFP(pfp);
      }
    } else {
      setSelectedPFP(pfp);
    }
  };

  const updatePFP = () => {
    if (selectedPFP) {
      updatePfp(
        {
          data: {
            contract_ref_address: selectedPFP.token_address,
            token_ref_id: selectedPFP.token_id,
          },
        },
        {
          onSuccess: () => {
            refetchProfile();
            refetch();
            setStep("ONBOARDING_CHECK");
          },
        }
      );
    }
  };

  useEffect(() => {
    if (profile && profile.pfp_metadata && profile.pfp_metadata.token_id) {
      setSelectedPFP({
        token_address: profile.pfp_metadata.contract_address,
        token_id: profile.pfp_metadata.token_id,
      });
    }
  }, [profile]);

  return (
    <div className="flex flex-1 flex-col items-start w-full overflow-hidden">
      {isFetchingPFPOwnedData ? (
        <>
          <span className="text-xl text-start">Please Wait</span>
          <span className="text-sm mt-2">Fetching your blocks...</span>
        </>
      ) : (
        <>
          <h4 className="text-xl text-start">Choose your PFP</h4>
          <p className="text-sm mt-1">
            Only a chosen set of PFP Collections are eligible for Zo World PFP.{" "}
            <span
              className="underline font-semibold"
              onClick={setAllowlistVisible.bind(null, true)}
            >
              View List
            </span>
          </p>
          <div className="w-full mt-4 flex-1 overflow-hidden flex flex-col">
            <ul className="w-full flex flex-col items-start space-y-4 overflow-y-auto ">
              {isValidObject(pfpOwnedData) &&
                Object.keys(pfpOwnedData as GeneralObject).map((key) => {
                  const collection = ((pfpOwnedData as GeneralObject) || {})[
                    key
                  ];
                  return (
                    <li key={key} className="flex flex-col w-full">
                      <span className="font-bold">{key}</span>
                      <ul className="flex items-start flex-nowrap overflow-x-auto max-w-full space-x-4 w-full mt-4">
                        {collection.map((pfp: GeneralObject) => {
                          const isSelected =
                            selectedPFP?.token_address === pfp.token_address &&
                            selectedPFP?.token_id === pfp.token_id;
                          return (
                            <li
                              key={pfp.token_id}
                              className="flex flex-col items-center cursor-pointer space-y-2 w-40 portrait:w-40 flex-shrink-0 relative"
                              onClick={toggleSelectPFP.bind(null, pfp)}
                            >
                              <img
                                src={getImageUri(pfp.metadata.image)}
                                alt=""
                                className="w-40 h-40 portrait:w-40 portrait:h-40"
                              />
                              {isSelected && (
                                <div className="absolute -top-2 left-0 right-0 w-40 h-40 portrait:w-40 portrait:h-40 bg-zui-pink border-4 border-zui-pink bg-opacity-40">
                                  <i className="uil uil-check-circle text-zui-white text-2xl p-2" />
                                </div>
                              )}
                              <span
                                className={`text-sm max-w-full truncate overflow-ellipsis ${
                                  isSelected ? "text-zui-pink" : ""
                                }`}
                              >
                                {pfp.metadata.name || pfp.metadata.title}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
            </ul>
            <div className="flex items-start flex-col my-4 flex-shrink-0">
              <button
                className="flex px-8 py-4 bg-zui-white text-zui-dark"
                disabled={
                  selectedPFP?.token_address ===
                    profile?.pfp_metadata?.contract_address &&
                  selectedPFP?.token_id === profile?.pfp_metadata?.token_id
                }
                onClick={updatePFP}
              >
                Update
              </button>
              <span className="text-sm">
                Have more PFPs?{" "}
                <button
                  className="underline mt-2 font-semibold"
                  onClick={setStep.bind(null, "WALLET_ADDITION")}
                >
                  Add another Wallet
                </button>
              </span>
            </div>
          </div>
          {isAllowlistVisible && (
            <AllowedCollectionModal
              data={collectionData?.data.results}
              close={setAllowlistVisible.bind(null, false)}
            />
          )}
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

export default SetPFP;
