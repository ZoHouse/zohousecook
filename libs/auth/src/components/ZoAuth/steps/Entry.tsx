import { AuthUser, LoginTypes } from "@zo/definitions/auth";
import { handleRequestOtpError, logAxiosError } from "@zo/utils/auth";
import { useResponseFlash } from "@zo/utils/hooks";
import { Collapse } from "antd";
import { AxiosError } from "axios";
import {
  isPossibleNumber,
  isValidNumber,
  parsePhoneNumber,
} from "libphonenumber-js";
import { MobileInput, OtpInputComponent } from "libs/moal/src";
import { FC, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "../../../contexts/auth";
import { useZostelAuth } from "../../../contexts/authZostel";
import { useMutationApi } from "../../../hooks";
import { ZoAuthStepProps } from "../ZoAuth";
import CustomButton from "../components/CustomConnectButton";
import YoutubeModal from "../modals/Youtube";

// Zo Zo! Making the entry more welcoming for our Web3 believers! 🚀
// This component now handles mobile verification right at the entry - no more jumping around!

// Extend window interface for reCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

interface EntryProps extends ZoAuthStepProps {
  allowedLoginTypes: LoginTypes[];
  showOtherLoginOptions: boolean;
  login: (user: AuthUser, token: string, validTill: number) => void;
  isZostelLoginRequired?: boolean; // Supporting our Zostel fam!
  onSuccess?: () => void;
}

const Entry: FC<EntryProps> = ({
  setStep,
  setFocus,
  allowedLoginTypes,
  showOtherLoginOptions,
  login,
  isZostelLoginRequired,
  onSuccess,
}) => {
  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  const { isConnected } = useAccount();
  const { isLoggedIn } = useAuth();
  const [isYoutubeModalVisible, setYoutubeModalVisible] =
    useState<boolean>(false);
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [timer, setTimer] = useState<number>(30);
  const [isResendOtpButtonDisabled, setIsResendOtpButtonDisabled] =
    useState<boolean>(true);
  const [otpVerificationResponse, setOptVerificationResponse] =
    useResponseFlash();
  const [mobileLoginStep, setMobileLoginStep] = useState<
    "REQUEST_OTP" | "ENTER_OTP"
  >("REQUEST_OTP");
  const { mutate: requestOtp, isLoading: isSendingOtp } = useMutationApi(
    "AUTH_LOGIN_MOBILE_OTP",
  );
  const { mutate: getZostelCreds } = useMutationApi(
    "AUTH_REQUEST_OTP_ZOSTEL",
    {}
  );
  const { mutate: activateZostel } = useMutationApi("AUTH_ACTIVATE");
  const { mutate: verifyOtp } = useMutationApi("AUTH_LOGIN_MOBILE");
  const { login: loginZostel } = useZostelAuth();

  const proceedText = useMemo(() => {
    const baseText = "Login with ";
    let loginMethods = [];

    if (allowedLoginTypes.includes("email")) loginMethods.push("email");
    if (allowedLoginTypes.includes("mobile")) loginMethods.push("mobile");
    if (allowedLoginTypes.includes("wallet"))
      loginMethods.push("connect your Ethereum wallet");

    if (loginMethods.length === 0) return ""; // If no methods are available, return an empty string

    // Create the final sentence
    const finalText = `${baseText}${loginMethods.join(" or ")} to proceed.`;

    return finalText;
  }, [allowedLoginTypes]);

  const hiddenLoginOptions = useMemo(() => {
    const allLoginTypes: LoginTypes[] = ["email", "mobile", "wallet"];
    return allLoginTypes.filter((type) => !allowedLoginTypes.includes(type));
  }, [allowedLoginTypes]);

  // Handle returning users who are already logged in when the modal opens.
  // OTP success handlers call setStep("ONBOARDING_CHECK") directly, so this
  // effect only needs to fire on mount (not on every isLoggedIn change).
  useEffect(() => {
    if (isLoggedIn) {
      setStep("ONBOARDING_CHECK");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMobileSubmit = async () => {
    if (!mobileNumber) return;
    const phoneNumber = parsePhoneNumber(`+${mobileNumber}`);
    if (!phoneNumber.isValid()) return;

    // Backend requires a captcha_response_token on every OTP request,
    // regardless of country code. Resolve a reCAPTCHA v3 token first.
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_KEY;
    if (!siteKey || typeof window === "undefined" || !window.grecaptcha) {
      setOptVerificationResponse(
        "Verification service unavailable. Reload and try again."
      );
      return;
    }

    let captchaToken: string;
    try {
      await new Promise<void>((resolve) => {
        window.grecaptcha.ready(() => resolve());
      });
      captchaToken = await window.grecaptcha.execute(siteKey, {
        action: "request_otp",
      });
    } catch (err) {
      console.error("reCAPTCHA error:", err);
      setOptVerificationResponse(
        "Could not verify reCAPTCHA. Reload and try again."
      );
      return;
    }

    const data = {
      mobile_number: phoneNumber.nationalNumber,
      mobile_country_code: phoneNumber.countryCallingCode,
      captcha_response_token: captchaToken,
    };
    requestOtp(
      { data },
      {
        onSuccess: () => {
          setMobileLoginStep("ENTER_OTP");
          setTimer(30);
          setIsResendOtpButtonDisabled(true);
        },
        onError: (error) => {
          const status = (error as AxiosError)?.response?.status;
          const msg =
            status === 429
              ? "Too many attempts. Try again in a minute."
              : status === 400
              ? "Invalid mobile number."
              : "Could not send OTP. Check your connection and try again.";
          setOptVerificationResponse(msg);
          handleRequestOtpError(error as AxiosError);
          logAxiosError(error);
        },
      }
    );
  };

  // Zo Zo! Handling OTP verification right where users land
  const handleOTPFormSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (mobileNumber && otp.length === 6) {
      const phoneNumber = parsePhoneNumber(`+${mobileNumber}`);

      const data = {
        mobile_number: phoneNumber.nationalNumber,
        mobile_country_code: phoneNumber.countryCallingCode,
        otp,
      };
      verifyOtp(
        { data },
        {
          onSuccess: (data) => {
            if (data && data.status === 200) {
              login(data.data.user, data.data.token, data.data.valid_till);
              if (onSuccess) {
                onSuccess();
              }
              isZostelLoginRequired
                ? getZostelCreds(
                    { data: {} },
                    {
                      onSuccess: (datas: any) => {
                        activateZostel(
                          {
                            data: {
                              mobile: datas.data.mobile_number,
                              mobile_country_code:
                                datas.data.mobile_country_code,
                              otp: datas.data.code,
                            },
                          },
                          {
                            onSuccess: async (data: any) => {
                              loginZostel(
                                data.data.user,
                                data.data.user_token,
                                data.data.token_expiry
                              );
                              setStep("ONBOARDING_CHECK");
                            },
                            onError(error) {
                              console.log("activateZostel onError:", error);
                            },
                          }
                        );
                      },
                      onError(error) {
                        console.log("getZostelCreds onError:", error);
                      },
                    }
                  )
                : setStep("ONBOARDING_CHECK");
            }
          },
          onError(error) {
            const customError = error as { response?: { status?: number } };
            if (customError.response?.status === 401) {
              setOptVerificationResponse("Invalid OTP");
            } else {
              setOptVerificationResponse("An Error Occurred");
            }
          },
        }
      );
    }
  };

  useEffect(() => {
    if (mobileLoginStep === "ENTER_OTP") {
      let interval: NodeJS.Timeout | undefined;
      if (timer > 0) {
        setIsResendOtpButtonDisabled(true);
        interval = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer <= 1) {
              setIsResendOtpButtonDisabled(false);
              return 0;
            }
            return prevTimer - 1;
          });
        }, 1000);
      } else {
        setIsResendOtpButtonDisabled(false);
      }
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [timer, mobileLoginStep]);

  // Load and cleanup reCAPTCHA script
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_KEY;
    if (!siteKey) {
      console.warn("reCAPTCHA site key not found");
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="recaptcha/api.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        // Remove script when component unmounts
        const scriptToRemove = document.querySelector(
          'script[src*="recaptcha/api.js"]'
        );
        if (scriptToRemove) {
          document.head.removeChild(scriptToRemove);
        }

        //Clean up reCAPTCHA badge
        const badge = document.querySelector(".grecaptcha-badge");
        if (badge && badge.parentElement) {
          badge.parentElement.remove();
        }
      };
    }
  }, []);

  const btnPrimary =
    "w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider bg-white text-black hover:bg-white/90 cursor-pointer transition-all disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed";
  const btnSecondary =
    "w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all";

  return (
    <div className="flex flex-col items-center w-full text-center">
      <span className="text-sm text-white/50 mb-6">
        Log in to stay tuned into the Zo Frequency.
      </span>
      <div className="flex flex-col gap-4 w-full">
        {allowedLoginTypes?.includes("mobile") && (
          <div className="w-full space-y-4">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              Your Mobile
            </span>
            <MobileInput
              className="w-full"
              onEnterKeyPress={handleMobileSubmit}
              value={mobileNumber}
              setter={setMobileNumber}
            />

            {mobileLoginStep === "ENTER_OTP" ? (
              <form onSubmit={handleOTPFormSubmit} className="space-y-4">
                <OtpInputComponent value={otp} setter={setOtp} numInputs={6} />
                {otpVerificationResponse && (
                  <span className="text-xs text-red-400">
                    {otpVerificationResponse}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={String(otp).replace("-", "").length !== 6}
                  className={btnPrimary}
                >
                  Verify OTP
                </button>
                <span className="text-sm text-white/50">
                  Didn&apos;t receive the code?{" "}
                  {timer > 0 ? (
                    <>
                      <button
                        className="text-[#66DF48]/50 cursor-not-allowed"
                        disabled={true}
                        type="button"
                      >
                        Resend OTP
                      </button>{" "}
                      <span className="text-white/30">
                        (00:{timer < 10 ? `0${timer}` : timer})
                      </span>
                    </>
                  ) : (
                    <button
                      className="text-[#66DF48] hover:text-[#66DF48]/80 transition-colors"
                      onClick={handleMobileSubmit}
                      disabled={isResendOtpButtonDisabled}
                      type="button"
                    >
                      Resend OTP
                    </button>
                  )}
                </span>
              </form>
            ) : (
              <>
                {otpVerificationResponse && (
                  <span className="text-xs text-red-400 block">
                    {otpVerificationResponse}
                  </span>
                )}
                <button
                  type="submit"
                  onClick={handleMobileSubmit}
                  className={btnPrimary}
                  disabled={
                    isSendingOtp ||
                    (mobileNumber?.startsWith("91")
                      ? !isValidNumber("+" + mobileNumber, "IN")
                      : !isPossibleNumber("+" + mobileNumber))
                  }
                >
                  {isSendingOtp ? "Sending code…" : "Send Verification Code"}
                </button>
              </>
            )}
          </div>
        )}

        {allowedLoginTypes?.includes("email") && (
          <button
            className={btnSecondary}
            onClick={setStep.bind(null, "EMAIL_LOGIN")}
          >
            Continue with Email
          </button>
        )}

        {allowedLoginTypes?.includes("wallet") && <CustomButton />}
      </div>

      {showOtherLoginOptions && (
        <Collapse
          className="w-full mt-4 bg-transparent border-none"
          items={[
            {
              key: "1",
              label: (
                <span className="text-xs text-white/40 uppercase tracking-wider">
                  Other login options
                </span>
              ),
              children: (
                <div className="flex flex-col gap-3">
                  {hiddenLoginOptions?.includes("email") && (
                    <button
                      className={btnSecondary}
                      onClick={setStep.bind(null, "EMAIL_LOGIN")}
                    >
                      Continue with Email
                    </button>
                  )}
                  {hiddenLoginOptions?.includes("mobile") && (
                    <button
                      className={btnSecondary}
                      onClick={setStep.bind(null, "MOBILE_LOGIN")}
                    >
                      Continue with Mobile
                    </button>
                  )}
                  {hiddenLoginOptions?.includes("wallet") && <CustomButton />}
                </div>
              ),
            },
          ]}
        />
      )}

      {allowedLoginTypes?.includes("wallet") && (
        <button
          className="text-xs text-white/30 hover:text-white/50 mt-6 transition-colors"
          onClick={setYoutubeModalVisible.bind(null, true)}
        >
          Learn more about Zo World
        </button>
      )}

      {allowedLoginTypes?.includes("wallet") && isYoutubeModalVisible && (
        <YoutubeModal
          videoCode="jxLkbJozKbY"
          close={setYoutubeModalVisible.bind(null, false)}
        />
      )}
    </div>
  );
};

export default Entry;
