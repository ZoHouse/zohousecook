/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @next/next/no-img-element */
import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import { FC, useEffect, useState } from "react";
import { Button } from "../common";
import AllowedCollectionModal from "./AllowedCollections";

interface PFPModalProps {
  close: () => void;
  showWallets: () => void;
}

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
};

const PFPModal: FC<PFPModalProps> = ({ close, showWallets }) => {
  const { profile, refetchProfile } = useProfile();
  const [selectedPFP, setSelectedPFP] = useState<GeneralObject | null>(null);
  const [isAllowlistVisible, setAllowlistVisible] = useState<boolean>(false);

  const { data: collectionData } = useQueryApi<GeneralObject>(
    "SOCIALS_SHOWCASE_COLLECTIONS",
    {
      enabled: profile != null && profile.wallet_address != null,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
    },
    ``,
    ""
  );

  const { mutate: updatePfp, isLoading: isUpdatingPFP } = useMutationApi(
    "PROFILE_ME_PFP",
    {},
    "",
    "POST"
  );

  const { data: pfpOwnedData, isFetching: isFetchingPFPOwnedData } =
    useQueryApi(
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
            close();
          },
        }
      );
    }
  };

  useEffect(() => {
    if (profile && profile.pfp_metadata) {
      setSelectedPFP({
        token_address: profile.pfp_metadata.contract_address,
        token_id: profile.pfp_metadata.token_id,
      });
    }
  }, [profile]);

  return (
    <div className="fixed inset-0 z-20 px-4 bg-zui-white text-zui-white bg-opacity-60 flex items-center justify-center">
      <div className="fixed inset-0" onClick={close} />
      <div className="w-full h-auto max-h-full overflow-y-auto bg-zui-black p-4 portrait:p-4 relative max-w-4xl">
        <button
          className="absolute z-10 top-2 right-2 flex items-center bg-zui-white justify-center w-8 h-8 text-zui-white text-xl text-zui-black"
          onClick={close}
        >
          <i className="uil uil-times" />
        </button>
        {isFetchingPFPOwnedData ? (
          <div className="flex flex-col items-center justify-center my-12">
            <i className="uil uil-spinner text-zui-white text-4xl animate-spin" />
            <span className="text-xl mt-4 portrait:text-lg text-zui-white uppercase font-bold">
              Please Wait...
            </span>
            <span className=" text-xl mt-2 font-bold text-zui-magenta leading-none">
              Fetching your NFTs
            </span>
          </div>
        ) : pfpOwnedData && Object.keys(pfpOwnedData).length === 0 ? (
          <div className="flex flex-1 flex-col w-full items-start relative">
            <span className=" text-2xl text-zui-magenta portrait:text-xl font-semibold">
              Select your Profile Picture
            </span>
            <span className="mt-4">
              Only a selected list of Collections are eligible for PFPs and
              sadly, you don&apos;t own any of NFTs from these collections. Add
              another wallet, which might have a PFP eligible NFT.
            </span>
            <button
              className="underline font-semibold my-4"
              onClick={setAllowlistVisible.bind(null, true)}
            >
              View Allowed Collections
            </button>
            <Button
              className="mb-4"
              icon="arrow-right"
              fixedsize
              theme="light"
              onClick={showWallets}
            >
              Add Wallet
            </Button>
            <Button fixedsize theme="light" onClick={close}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col w-full items-start relative">
            <span className=" text-2xl text-zui-magenta portrait:text-xl font-semibold">
              Select your Profile Picture
            </span>
            <button
              className="underline font-semibold"
              onClick={setAllowlistVisible.bind(null, true)}
            >
              View Allowed Collections
            </button>
            <ul className="w-full mt-4 flex flex-col items-start space-y-4 max-h-[45vh] overflow-y-auto ">
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
                                <div className="absolute -top-2 left-0 right-0 w-40 h-40 portrait:w-40 portrait:h-40 bg-zui-magenta border-4 border-zui-magenta bg-opacity-40">
                                  <i className="uil uil-check-circle text-zui-white text-2xl p-2" />
                                </div>
                              )}
                              <span
                                className={`text-sm max-w-full portrait:text-lg truncate overflow-ellipsis ${
                                  isSelected ? "text-zui-magenta" : ""
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

            {pfpOwnedData && Object.keys(pfpOwnedData).length !== 0 && (
              <div className="flex items-center self-start space-x-[2vh] mt-[4vh]">
                <Button
                  fixedsize
                  icon="arrow-right"
                  theme="light"
                  disabled={
                    selectedPFP?.token_address ===
                      profile?.pfp_metadata?.contract_address &&
                    selectedPFP?.token_id === profile.pfp_metadata?.token_id
                  }
                  isLoading={isUpdatingPFP}
                  onClick={updatePFP}
                >
                  Update
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {isAllowlistVisible && (
        <AllowedCollectionModal
          data={(collectionData?.data || []).results}
          close={setAllowlistVisible.bind(null, false)}
        />
      )}
    </div>
  );
};

export default PFPModal;
