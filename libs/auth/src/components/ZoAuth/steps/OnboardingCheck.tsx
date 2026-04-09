/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import { ZoAuthStep, ZoAuthStepProps } from "../ZoAuth";

function groupBy(array: any[], key: string) {
  return array.reduce(function (result, currentValue) {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    );
    return result;
  }, {});
}

interface OnboardingCheckProps extends ZoAuthStepProps {
  setOnboardingQueue: (queue: ZoAuthStep[]) => void;
}

const OnboardingCheck: FC<OnboardingCheckProps> = ({ setFocus, setStep, setOnboardingQueue }) => {
  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  const { profile, refetchProfile } = useProfile();
  // const [isAllDataFetched, setAllDataFetched] = useState<boolean>(false);

  // const { data: ensOwnedData, refetch: fetchENSData } = useQueryApi(
  //   "PROFILE_ME_ENS",
  //   {
  //     enabled: false,
  //     refetchIntervalInBackground: false,
  //     refetchOnWindowFocus: false,
  //   },
  //   "",
  //   ""
  // );
  // const { data: pfpOwnedData, refetch: fetchPFPData } = useQueryApi(
  //   "PROFILE_ME_PFP",
  //   {
  //     enabled: false,
  //     refetchIntervalInBackground: false,
  //     refetchOnWindowFocus: false,
  //   },
  //   ``,
  //   ""
  // );

  // useEffect(() => {
  //   if (profile && ensOwnedData?.data && pfpOwnedData?.data) {
  //     setTimeout(() => {
  //       setAllDataFetched(true);
  //     }, 1000);
  //   }
  // }, [ensOwnedData?.data, pfpOwnedData?.data, profile]);

  useEffect(() => {
    if (profile) {
      console.log(profile);
      // if (
      //   string.isValidString(profile.ens_nickname) ||
      //   string.isValidString(profile.custom_nickname)
      // ) {
      //   if (
      //     string.isValidString(profile.pfp_image) ||
      //     (object.isValidObject(profile.pfp_metadata) &&
      //       profile.pfp_metadata.is_valid)
      //   ) {
      //     if (
      //       profile.socials.find((s: any) => s.category === "Twitter") != null
      //     ) {
      //       setStep("WELCOME");
      //     } else {
      //       if (
      //         localStorage.getItem("zo-onboarding-socials-skipped") === "true"
      //       ) {
      //         setStep("WELCOME");
      //       } else {
      //         setStep("SOCIALS");
      //       }
      //     }
      //   } else {
      //     if (pfpOwnedData?.data.results.length > 0) {
      //       setStep("SET_PFP");
      //     } else {
      //       if (localStorage.getItem("zo-onboarding-pfp-skipped") === "true") {
      //         setStep("WELCOME");
      //       } else {
      //         setStep("NO_PFP");
      //       }
      //     }
      //   }
      // } else {
      //   if (
      //     !(
      //       string.isValidString(profile.pfp_image) ||
      //       (object.isValidObject(profile.pfp_metadata) &&
      //         profile.pfp_metadata.is_valid)
      //     )
      //   ) {
      //     setStep("INTRO");
      //   } else {
      //     if (ensOwnedData?.data.results.length > 0) {
      //       setStep("SET_ENS");
      //     } else {
      //       setStep("NO_ENS");
      //     }
      //   }
      // }
      setStep("WELCOME");
      // DEV
      // setStep("FOUNDER");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     refetchProfile();
  //   }, 2000);

  //   return () => {
  //     clearTimeout(timer);
  //     setAllDataFetched(false);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <div className="flex flex-1 flex-col items-start">
      <span className="text-xl text-start">Please Wait</span>
      <span className="text-sm mt-2">Fetching your blocks...</span>

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

export default OnboardingCheck;
