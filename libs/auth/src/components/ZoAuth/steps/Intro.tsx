/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import useQueryApi from "../../../hooks/useQueryApi";
import { ZoAuthStepProps } from "../ZoAuth";

const Intro: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  const { profile } = useProfile();
  const [nextStep, setNextStep] = useState<"SET_ENS" | "NO_ENS">("SET_ENS");

  const { data: ensOwnedData, isSuccess } = useQueryApi(
    "PROFILE_ME_ENS",
    {
      enabled: profile != null && profile.wallet_address != null,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
    },
    "",
    ""
  );

  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  useEffect(() => {
    if (ensOwnedData?.data) {
      if (ensOwnedData?.data.results.length > 0) {
        setNextStep("SET_ENS");
      } else {
        setNextStep("NO_ENS");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensOwnedData?.data]);

  return (
    <div className="flex flex-1 flex-col items-start">
      <div className="flex flex-shrink-0 flex-col mb-4 items-start">
        <span className="font-semibold text-xl leading-none">Welcome to</span>
        <h1 className="font-bold text-3xl mt-2 text-zui-pink ">Zo World</h1>
      </div>
      <span className="mt-2">
        You are now entering into a web3 club. For this, you'll need an
        identity. You Web3 identity consists of 2 elements.
      </span>
      <span className="mt-2">
        <strong
          className="underline decoration-dashed cursor-pointer"
          onMouseEnter={setFocus.bind(null, "pfp")}
          onMouseLeave={setFocus.bind(null, "all")}
        >
          Your PFP:
        </strong>{" "}
        This is how people in the Zo World will recognise you.
      </span>
      <span className="mt-2">
        <strong
          className="underline decoration-dashed cursor-pointer"
          onMouseEnter={setFocus.bind(null, "name")}
          onMouseLeave={setFocus.bind(null, "all")}
        >
          Your Nickname:
        </strong>{" "}
        Generally ending with .eth (an ENS), this will how you'll be called in
        the Zo World.
        <br />
      </span>

      {isSuccess && (
        <button
          className="flex px-8 py-4 bg-zui-white text-zui-dark mt-8"
          onClick={setStep.bind(null, nextStep)}
        >
          Let's Go!
        </button>
      )}

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

export default Intro;
