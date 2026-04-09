import { FC, useEffect } from "react";
import useProfile from "../../../hooks/useProfile";
import { ZoAuthStepProps } from "../ZoAuth";

interface WelcomeProps extends ZoAuthStepProps {
  hideModal: () => void;
}

const Welcome: FC<WelcomeProps> = ({ setFocus, hideModal }) => {
  const { profile } = useProfile();

  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  useEffect(() => {
    const timer = setTimeout(hideModal, 2000);
    return () => clearTimeout(timer);
  }, [hideModal]);

  const displayName =
    profile?.custom_nickname?.replace(".zo", "") ||
    profile?.ens_nickname ||
    profile?.first_name ||
    "Citizen";

  const avatarUrl = profile?.avatar?.image;

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="Your Zobu"
          className="w-32 h-32 rounded-full mb-6 border-2 border-white/20"
        />
      )}
      <span className="text-2xl">
        Zo Zo{" "}
        <span className="text-zui-pink font-bold">{displayName}</span>!
      </span>
      <span className="text-xl mt-4">Welcome to Zo World</span>
      <i className="uil uil-spinner animate-spin mt-6" />
    </div>
  );
};

export default Welcome;
