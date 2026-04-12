import { Zo } from "@zo/assets/brands";
import Icon from "@zo/assets/icons";
import { AuthUser, LoginTypes } from "@zo/definitions/auth";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/auth";
import { useZostelAuth } from "../../contexts/authZostel";
import { trackOnboarding } from "../../utils/telemetry";
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
import Whereabouts from "./steps/Whereabouts";
interface ZoAuthProps {
  hideModal: () => void;
  isZostelLoginRequired?: boolean;
  login: (user: AuthUser, token: string, validTill: number) => void;
  allowedLoginTypes: LoginTypes[];
  showOtherLoginOptions?: boolean;
  redirectPath?: string | null;
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
  | "CULTURES";

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
  redirectPath,
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

  const router = useRouter();

  const advanceOnboarding = () => {
    const remaining = onboardingQueue.slice(1);
    setOnboardingQueue(remaining);
    if (remaining.length > 0) {
      replaceStep(remaining[0]);
    } else {
      trackOnboarding("onboarding_completed");
      navigateAfterAuth();
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

  const navigateAfterAuth = () => {
    hideModal();
    if (redirectPath && redirectPath !== router.asPath) {
      router.push(redirectPath);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !isOnboarding) {
      if (isLoggingWithMobile) {
        if (isZostelLoggedIn) {
          navigateAfterAuth();
          setLoggingWithMobile(false);
        }
      } else {
        navigateAfterAuth();
      }
    }
  }, [hideModal, isLoggedIn, isZostelLoggedIn, step, isOnboarding]);

  // Track abandonment during onboarding
  useEffect(() => {
    if (!isOnboarding) return;
    const handler = () => {
      trackOnboarding("onboarding_abandoned", { step_name: step });
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isOnboarding, step]);

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
            onComplete={() => {
              navigateAfterAuth();
            }}
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
      default:
        return null;
    }
  };

  return (
    <div className="bg-zui-dark text-zui-white w-full h-full fixed inset-0 z-[100]">
      {/* VHS static background */}
      <video
        autoPlay
        playsInline
        loop
        muted
        className="fixed inset-0 z-[100] w-full h-full pointer-events-none object-cover"
      >
        <source
          src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/artifacts-background.mp4"
          type="video/mp4"
        />
      </video>

      {/* TV Frame */}
      <img
        src="https://zoworld-static.s3.ap-south-1.amazonaws.com/media/meme/tv-frame.png"
        className="fixed inset-0 z-[110] w-full h-full pointer-events-none object-fill"
        alt=""
      />

      {/* UserCollection as background */}
      {!isOnboarding && (
        <div className="absolute inset-0 z-[101]">
          <UserCollection focus={focus} />
        </div>
      )}

      {/* Centered glass card */}
      <div className="relative z-[115] w-full h-full flex items-center justify-center px-10 py-16 md:px-4 md:py-4">
        <div
          className="w-full max-w-xs md:max-w-lg rounded-2xl border border-white/[0.12] px-5 py-6 md:px-10 md:py-12 overflow-hidden relative"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.3) 100%)",
            backdropFilter: "blur(60px) saturate(1.4)",
            WebkitBackdropFilter: "blur(60px) saturate(1.4)",
            boxShadow:
              "0 8px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)",
          }}
        >
          {/* Aurora glow */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[120%] h-48 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(102,223,72,0.15) 0%, rgba(45,180,120,0.08) 30%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-32 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)",
            }}
          />

          <div className="relative flex flex-col items-center w-full max-h-[75vh] overflow-y-auto">
            {step === "ENTRY" ? (
              <div className="flex flex-shrink-0 flex-col mb-2 items-center">
                <h1 className="font-bold text-2xl md:text-4xl text-white whitespace-nowrap">Welcome to Zo World</h1>
              </div>
            ) : !ONBOARDING_STEPS.includes(step) ? (
              <div className="flex flex-shrink-0 flex-col mb-4 items-start">
                <button onClick={goBack}>
                  <Icon name="ArrowLeft" size={24} fill="#fff" />
                </button>
              </div>
            ) : null}
            <div className="w-full">{renderStep()}</div>
          </div>

          <Zo
            className="absolute bottom-0 left-0 h-16 opacity-[0.04]"
            fill="white"
            fillOpacity={1}
          />
        </div>
      </div>
    </div>
  );
};

export default ZoAuth;
