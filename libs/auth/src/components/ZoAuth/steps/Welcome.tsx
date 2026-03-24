/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatAddress } from "@zo/utils/web3";
import { FC, useEffect } from "react";
import useProfile from "../../../hooks/useProfile";
import { ZoAuthStepProps } from "../ZoAuth";

interface WelcomeProps extends ZoAuthStepProps {
  hideModal: () => void;
}
const Welcome: FC<WelcomeProps> = ({ setFocus, setStep, hideModal }) => {
  const { profile } = useProfile();

  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  useEffect(() => {
    setTimeout(hideModal, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col mt-12 pt-3 items-start">
      <span className="text-2xl">
        Zo Zo{" "}
        <span className="text-zui-pink  font-bold">
          {profile?.ens_nickname ||
            profile?.custom_nickname ||
            formatAddress(profile?.wallet_address)}
        </span>
        !
      </span>
      <span className="text-xl mt-8">
        Welcome to the Zo World,{" "}
        {profile?.membership === "founder" ? "Founder" : "Human"}!
      </span>
      <i className="uil uil-spinner animate-spin mt-4" />
    </div>
  );
};

export default Welcome;
