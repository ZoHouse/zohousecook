/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";
import { ZoAuthStepProps } from "../ZoAuth";
import AllowedCollectionModal from "../modals/AllowedCollections";

const NoPFP: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("pfp");
  }, [setFocus]);

  const { profile, refetchProfile } = useProfile();
  const [isAllowlistVisible, setAllowlistVisible] = useState<boolean>(false);

  const skip = () => {
    localStorage.setItem("zo-onboarding-pfp-skipped", "true");
    setStep("ONBOARDING_CHECK");
  };

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

  return (
    <div className="flex flex-1 flex-col items-start">
      <span className="text-xl text-start">Oh man!</span>
      <span className="mt-2">
        Only a selected list of Collections are eligible for PFPs and sadly, you
        don't own any of NFTs from these collections. Add another wallet, which
        might have a PFP eligible NFT.
      </span>

      <button
        className="mt-4 underline font-medium"
        onClick={setAllowlistVisible.bind(null, true)}
      >
        View Allowed Collections
      </button>
      <button
        className="mt-8 flex px-8 py-4 bg-zui-white text-zui-dark"
        onClick={setStep.bind(null, "WALLET_ADDITION")}
      >
        Add Wallet
      </button>
      <button className="mt-2 underline font-medium" onClick={skip}>
        Continue without an PFP{" "}
        <span role="img" aria-label="sad">
          😢
        </span>
      </button>

      <span className="mt-auto text-sm my-4">
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
      {isAllowlistVisible && (
        <AllowedCollectionModal
          data={collectionData?.data.results}
          close={setAllowlistVisible.bind(null, false)}
        />
      )}
    </div>
  );
};

export default NoPFP;
