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
  const { mutate: requestOtp } = useMutationApi("AUTH_LOGIN_MOBILE_OTP");
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

  useEffect(() => {
    if (isLoggedIn != null) {
      if (isLoggedIn) {
        setStep("ONBOARDING_CHECK");
      } else {
        if (allowedLoginTypes.includes("wallet") || showOtherLoginOptions) {
          if (isConnected) {
            setStep("WALLET_CONNECTING");
          } else {
            setStep("ENTRY");
          }
        } else {
          setStep("ENTRY");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isLoggedIn]);

  const handleMobileSubmit = async () => {
    if (mobileNumber) {
      const phoneNumber = parsePhoneNumber(`+${mobileNumber}`);
      if (phoneNumber.isValid()) {
        if (phoneNumber.countryCallingCode !== "91") {
          try {
            const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_KEY;
            if (siteKey && typeof window !== "undefined" && window.grecaptcha) {
              await new Promise<void>((resolve) => {
                window.grecaptcha.ready(() => resolve());
              });

              const token = await window.grecaptcha.execute(siteKey, {
                action: "request_otp",
              });

              const data = {
                mobile_number: phoneNumber.nationalNumber,
                mobile_country_code: phoneNumber.countryCallingCode,
                captcha_response_token: token,
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
                    handleRequestOtpError(error as AxiosError);
                    logAxiosError(error);
                  },
                }
              );
            }
          } catch (err) {
            console.error("reCAPTCHA error:", err);
          }
        } else {
          requestOtp(
            {
              data: {
                mobile_number: phoneNumber.nationalNumber,
                mobile_country_code: phoneNumber.countryCallingCode,
              },
            },
            {
              onSuccess: () => {
                setMobileLoginStep("ENTER_OTP");
                setTimer(30);
                setIsResendOtpButtonDisabled(true);
              },
              onError: logAxiosError,
            }
          );
        }
      }
    }
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

  return (
    <div className="flex flex-1 flex-col items-start ">
      <span className="mb-8">
        Zo World is an alternate reality where everyone follows their heart, with a network of physical nodes and digital communities.
        <br />
        <br />
        Log in to stay tuned into the Zo Frequency.
      </span>
      <div className="flex flex-col space-y-4 w-full">
        {allowedLoginTypes?.includes("mobile") && (
          <div className="w-full space-y-4">
            <h3>Your Mobile</h3>
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
                  <span className="text-xs text-zui-red">
                    {otpVerificationResponse}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={String(otp).replace("-", "").length !== 6}
                  className="outline-none flex py-4 justify-center bg-zui-white text-zui-dark w-full disabled:cursor-not-allowed disabled:bg-zui-white/70"
                >
                  Verify OTP
                </button>
                <span className="text-sm">
                  Didn't receive the code?{" "}
                  {timer > 0 ? (
                    <>
                      <button
                        className="text-zui-neon cursor-not-allowed opacity-50"
                        disabled={true}
                        type="button"
                      >
                        Resend OTP
                      </button>{" "}
                      (00:{timer < 10 ? `0${timer}` : timer})
                    </>
                  ) : (
                    <button
                      className="text-zui-neon"
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
              <button
                type="submit"
                onClick={handleMobileSubmit}
                className="outline-none flex py-4 justify-center bg-zui-white text-zui-dark w-full disabled:cursor-not-allowed disabled:bg-zui-white/70"
                disabled={
                  mobileNumber?.startsWith("91")
                    ? !isValidNumber("+" + mobileNumber, "IN")
                    : !isPossibleNumber("+" + mobileNumber)
                }
              >
                Send Verification Code
              </button>
            )}
          </div>
        )}

        {allowedLoginTypes?.includes("email") && (
          <button
            className="flex py-4 justify-center bg-zui-white text-zui-dark w-[236px]"
            onClick={setStep.bind(null, "EMAIL_LOGIN")}
          >
            Continue with Email
          </button>
        )}

        {allowedLoginTypes?.includes("wallet") && <CustomButton />}
      </div>
      {allowedLoginTypes?.includes("wallet") && (
        <button
          className="text-sm underline mt-4"
          onClick={setYoutubeModalVisible.bind(null, true)}
        >
          Learn more about Zo World
        </button>
      )}

      {showOtherLoginOptions && (
        <Collapse
          className="w-[236px] mt-4 bg-transparent border-none"
          items={[
            {
              key: "1",
              label: "Other login options",
              children: (
                <div className="flex flex-col space-y-4">
                  {hiddenLoginOptions?.includes("email") && (
                    <button
                      className={
                        "flex py-4 justify-center bg-zui-white text-zui-dark w-full"
                      }
                      onClick={setStep.bind(null, "EMAIL_LOGIN")}
                    >
                      Continue with Email
                    </button>
                  )}
                  {hiddenLoginOptions?.includes("mobile") && (
                    <button
                      className={
                        "flex py-4 justify-center bg-zui-white text-zui-dark w-full"
                      }
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
