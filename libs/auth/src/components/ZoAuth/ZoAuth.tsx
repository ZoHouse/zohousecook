import { Zo } from "@zo/assets/brands";
import Icon from "@zo/assets/icons";
import { AuthUser, LoginTypes } from "@zo/definitions/auth";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/auth";
import { useZostelAuth } from "../../contexts/authZostel";
import UserCollection from "./components/UserCollection";
import EmailLogin from "./steps/EmailLogin";
import Entry from "./steps/Entry";
import Founder from "./steps/Founder";
import Intro from "./steps/Intro";
import MobileLogin from "./steps/MobileLogin";
import NoENS from "./steps/NoENS";
import NoFounder from "./steps/NoFounder";
import NoPFP from "./steps/NoPFP";
import OnboardingCheck from "./steps/OnboardingCheck";
import SetENS from "./steps/SetENS";
import SetPFP from "./steps/SetPFP";
import SetZo from "./steps/SetZo";
import Socials from "./steps/Socials";
import WalletAddition from "./steps/WalletAddition";
import WalletConnecting from "./steps/WalletConnecting";
import Welcome from "./steps/Welcome";
interface ZoAuthProps {
  hideModal: () => void;
  isZostelLoginRequired?: boolean;
  login: (user: AuthUser, token: string, validTill: number) => void;
  allowedLoginTypes: LoginTypes[];
  showOtherLoginOptions?: boolean;
}

export type ZoAuthStep =
  | "ENTRY"
  | "WALLET_CONNECTING"
  | "EMAIL_LOGIN"
  | "MOBILE_LOGIN"
  | "ONBOARDING_CHECK"
  | "INTRO"
  | "SET_ENS"
  | "NO_ENS"
  | "SET_ZO"
  | "SET_PFP"
  | "NO_PFP"
  | "WALLET_ADDITION"
  | "SOCIALS"
  | "NO_FOUNDER"
  | "FOUNDER"
  | "WELCOME";

export type ZoAuthFocus = "pfp" | "name" | "twitter" | "founder" | "all";

export interface ZoAuthStepProps {
  setStep: (step: ZoAuthStep) => void;
  setFocus: (focus: ZoAuthFocus) => void;
}

const ZoAuth: React.FC<ZoAuthProps> = ({
  login,
  hideModal,
  allowedLoginTypes,
  isZostelLoginRequired,
  showOtherLoginOptions = false,
}) => {
  const [steps, setSteps] = useState<ZoAuthStep[]>(["ENTRY"]);
  const [focus, setFocus] = useState<ZoAuthFocus>("all");
  const [isLoggingWithMobile, setLoggingWithMobile] = useState<boolean>(false);
  const { isLoggedIn } = useAuth();
  const { isLoggedIn: isZostelLoggedIn } = useZostelAuth();

  const step = useMemo(() => steps[steps.length - 1], [steps]);
  const setStep = (step: (typeof steps)[number]) => {
    setSteps((prev) => [...prev, step]);
  };
  const replaceStep = (step: (typeof steps)[number]) => {
    setSteps((prev) => [...prev.slice(0, prev.length - 1), step]);
  };
  const goBack = () => {
    setSteps((prev) => prev.slice(0, prev.length - 1));
  };

  const handleMobileLogin = (
    user: AuthUser,
    token: string,
    validTill: number
  ) => {
    setLoggingWithMobile(true);
    login(user, token, validTill);
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (isLoggingWithMobile) {
        if (isZostelLoggedIn) {
          hideModal();
          setLoggingWithMobile(false);
        }
      } else {
        hideModal();
      }
    }
  }, [hideModal, isLoggedIn, isZostelLoggedIn, step]);

  const renderStep = () => {
    switch (step) {
      case "ENTRY":
        return (
          <Entry
            setStep={setStep}
            setFocus={setFocus}
            allowedLoginTypes={allowedLoginTypes}
            showOtherLoginOptions={showOtherLoginOptions}
            login={login}
            isZostelLoginRequired={isZostelLoginRequired}
          />
        );
      case "WALLET_CONNECTING":
        return (
          <WalletConnecting
            setStep={setStep}
            setFocus={setFocus}
            login={login}
          />
        );
      case "EMAIL_LOGIN":
        return (
          <EmailLogin setFocus={setFocus} setStep={setStep} login={login} />
        );
      case "MOBILE_LOGIN":
        return (
          <MobileLogin
            setFocus={setFocus}
            setStep={setStep}
            login={handleMobileLogin}
            isZostelLoginRequired={isZostelLoginRequired}
          />
        );
      case "ONBOARDING_CHECK":
        return <OnboardingCheck setStep={setStep} setFocus={setFocus} />;
      case "INTRO":
        return <Intro setStep={replaceStep} setFocus={setFocus} />;
      case "SET_ENS":
        return <SetENS setStep={setStep} setFocus={setFocus} />;
      case "NO_ENS":
        return <NoENS setStep={setStep} setFocus={setFocus} />;
      case "SET_ZO":
        return <SetZo setStep={setStep} setFocus={setFocus} />;
      case "SET_PFP":
        return <SetPFP setStep={setStep} setFocus={setFocus} />;
      case "NO_PFP":
        return <NoPFP setStep={setStep} setFocus={setFocus} />;
      case "WALLET_ADDITION":
        return <WalletAddition setStep={setStep} setFocus={setFocus} />;
      case "SOCIALS":
        return <Socials setStep={setStep} setFocus={setFocus} />;
      case "FOUNDER":
        return <Founder setStep={setStep} setFocus={setFocus} />;
      case "NO_FOUNDER":
        return <NoFounder setStep={setStep} setFocus={setFocus} />;
      case "WELCOME":
        return (
          <Welcome
            setStep={setStep}
            setFocus={setFocus}
            hideModal={hideModal}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-zui-dark text-zui-white w-full h-full fixed inset-0 z-[100] flex">
      <div className="md:max-w-sm w-full flex-shrink-0 mx-auto flex flex-col items-start h-full p-4 overflow-hidden relative">
        {step === "ENTRY" ? (
          <div className="flex flex-shrink-0 flex-col mb-4 items-start">
            <span className="font-semibold text-3xl leading-none">
              Follow Your Heart
            </span>
            <h1 className="font-bold text-6xl mt-2 text-zui-pink ">Zo World</h1>
          </div>
        ) : step !== "WELCOME" ? (
          <div className="flex flex-shrink-0 flex-col mb-4 items-start">
            <button onClick={goBack}>
              <Icon name="ArrowLeft" size={24} fill="#fff" />
            </button>
          </div>
        ) : null}
        {renderStep()}
        <Zo
          className="absolute bottom-0 left-0 h-28"
          fill="white"
          fillOpacity={0.1}
        />
      </div>
      <UserCollection focus={focus} />
    </div>
  );
};

export default ZoAuth;
