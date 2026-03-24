/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useEffect } from "react";
import { ZoAuthStepProps } from "../ZoAuth";

const NoENS: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const openENS = () => {
    window.open("https://app.ens.domains/", "_blank");
  };

  return (
    <div className="flex flex-1 flex-col items-start">
      <span className="text-xl text-start">Oh Wait!</span>
      <span className="mt-2">
        It looks like you don't have any ENS in your wallet. Try adding a wallet
        to your account, which has an ENS.
      </span>

      <button
        className="flex px-8 py-4 bg-zui-white text-zui-dark mt-8"
        onClick={setStep.bind(null, "WALLET_ADDITION")}
      >
        Add Wallet
      </button>
      <button className="mt-4 underline font-medium" onClick={openENS}>
        Buy ENS
      </button>
      <button
        className="mt-2 underline font-medium"
        onClick={setStep.bind(null, "SET_ZO")}
      >
        Continue without an ENS{" "}
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
    </div>
  );
};

export default NoENS;
