import { Zo } from "@zo/assets/brands";
import Icon from "@zo/assets/icons";
import { AuthUser, LoginTypes } from "@zo/definitions/auth";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/auth";
import { useZostelAuth } from "../../contexts/authZostel";
import UserCollection from "./components/UserCollection";
import Avatar from "./steps/Avatar";
import Birthday from "./steps/Birthday";
import Citizen from "./steps/Citizen";
import Cultures from "./steps/Cultures";
import EmailLogin from "./steps/EmailLogin";
import Entry from "./steps/Entry";
import Hometown from "./steps/Hometown";
import MobileLogin from "./steps/MobileLogin";
import Nickname from "./steps/Nickname";
import OnboardingCheck from "./steps/OnboardingCheck";
import Welcome from "./steps/Welcome";
import Whereabouts from "./steps/Whereabouts";
interface ZoAuthProps {
  hideModal: () => void;
  isZostelLoginRequired?: boolean;
  login: (user: AuthUser, token: string, validTill: number) => void;
  allowedLoginTypes: LoginTypes[];
  showOtherLoginOptions?: boolean;
}

export type ZoAuthStep =
  | "ENTRY"
  | "MOBILE_LOGIN"
  | "EMAIL_LOGIN"
  | "ONBOARDING_CHECK"
  | "NICKNAME"
  | "AVATAR"
  | "WHEREABOUTS"
  | "CITIZEN"
  | "HOMETOWN"
  | "BIRTHDAY"
  | "CULTURES"
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

  const ONBOARDING_STEPS: ZoAuthStep[] = [
    "ONBOARDING_CHECK",
    "NICKNAME",
    "AVATAR",
    "WHEREABOUTS",
    "CITIZEN",
    "HOMETOWN",
    "BIRTHDAY",
    "CULTURES",
  ];

  const isOnboarding = ONBOARDING_STEPS.includes(step);

  const [onboardingQueue, setOnboardingQueue] = useState<ZoAuthStep[]>([]);

  const advanceOnboarding = () => {
    const remaining = onboardingQueue.slice(1);
    setOnboardingQueue(remaining);
    if (remaining.length > 0) {
      replaceStep(remaining[0]);
    } else {
      replaceStep("WELCOME");
    }
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
    if (isLoggedIn && !isOnboarding) {
      if (isLoggingWithMobile) {
        if (isZostelLoggedIn) {
          hideModal();
          setLoggingWithMobile(false);
        }
      } else {
        hideModal();
      }
    }
  }, [hideModal, isLoggedIn, isZostelLoggedIn, step, isOnboarding]);

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
        return (
          <OnboardingCheck
            setStep={setStep}
            setFocus={setFocus}
            setOnboardingQueue={setOnboardingQueue}
          />
        );
      case "NICKNAME":
        return <Nickname advanceOnboarding={advanceOnboarding} />;
      case "AVATAR":
        return <Avatar advanceOnboarding={advanceOnboarding} />;
      case "WHEREABOUTS":
        return <Whereabouts advanceOnboarding={advanceOnboarding} />;
      case "CITIZEN":
        return <Citizen advanceOnboarding={advanceOnboarding} />;
      case "HOMETOWN":
        return <Hometown advanceOnboarding={advanceOnboarding} />;
      case "BIRTHDAY":
        return <Birthday advanceOnboarding={advanceOnboarding} />;
      case "CULTURES":
        return <Cultures advanceOnboarding={advanceOnboarding} />;
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
        ) : step !== "WELCOME" && !ONBOARDING_STEPS.includes(step) ? (
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
      {!isOnboarding && <UserCollection focus={focus} />}
    </div>
  );
};

export default ZoAuth;
