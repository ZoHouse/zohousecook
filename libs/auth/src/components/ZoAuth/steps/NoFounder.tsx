/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect } from "react";
import { ZoAuthStepProps } from "../ZoAuth";

const NoFounder: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("founder");
  }, [setFocus]);

  const openOpensea = () => {
    window.open("https://opensea.io/collection/founders-of-zo-world", "_blank");
  };

  return (
    <div className="flex flex-1 flex-col items-start">
      <span className="text-xl text-start">You're missing out</span>
      <span className="mt-2">
        Founders Members get 50% off on all our Zo Houses bookings, exclusive
        entries to our events, personalised world class concierge services and
        many more.
      </span>

      <button
        className="mt-8 flex px-8 py-4 bg-zui-white text-zui-dark"
        onClick={openOpensea}
      >
        Buy on Opensea
      </button>
      <span className="mt-4">
        Have Founder NFT in another wallet?{" "}
        <button
          className="inline underline font-medium"
          onClick={setStep.bind(null, "WALLET_ADDITION")}
        >
          Add that wallet
        </button>
      </span>
      <button
        className="mt-4 underline font-medium"
        onClick={setStep.bind(null, "WELCOME")}
      >
        I'll live with it
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

export default NoFounder;
