/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useEffect } from "react";
import { ZoAuthStepProps } from "../ZoAuth";

const Founder: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("founder");
  }, [setFocus]);

  return (
    <div className="flex flex-1 flex-col items-start">
      <span className="text-xl text-start">
        Woah! You're a Founder Member{" "}
        <span role="img" aria-label="star struck">
          🤩
        </span>
      </span>
      <span className="mt-2">
        You'll be getting 50% off on all our Zo Houses bookings, exclusive
        entries to our events, personalised world class concierge services and
        many more.
      </span>

      <button
        className="flex px-8 py-4 bg-zui-white text-zui-dark mt-8"
        onClick={setStep.bind(null, "WELCOME")}
      >
        Let' Go!
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

export default Founder;
