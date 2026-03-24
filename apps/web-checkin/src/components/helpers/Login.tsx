import Icon from "@zo/assets/icons";
import { useAuth, useMutationApi, useZostelAuth } from "@zo/auth";
import { isValidString } from "@zo/utils/string";
import { parsePhoneNumber } from "libphonenumber-js";
import { showToast } from "libs/moal/src/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button, OtpInput, PhoneInput } from "../ui";

interface LoginProps {
  mobile: string;
  setMobile: (value: string) => void;
  operatorName?: string;
}
interface ResendOtpProps {
  handleOTPRequest: (method: string) => void;
  timer: number;
  onForceResend?: () => void;
  showForceResend?: boolean;
}

const ResendOtp: React.FC<ResendOtpProps> = ({
  handleOTPRequest,
  timer,
  onForceResend,
  showForceResend = false,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 text-sm text-zostel-light-text-secondary">
      {timer === 0 ? (
        <div className="flex flex-col items-center gap-1">
          <p>Didn't receive the OTP?</p>
          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              onClick={() => handleOTPRequest("whatsapp")}
              className="text-zostel-light-text-primary text-sm whitespace-nowrap gap-2"
            >
              Resend via{" "}
              <Icon name="WhatsApp" size={20} fill="#111111" className="mr-2" />
            </Button>
            <span>or</span>
            <Button
              variant="tertiary"
              onClick={() => handleOTPRequest("")}
              className="text-zostel-light-text-primary text-sm whitespace-nowrap gap-2"
            >
              Resend via{" "}
              <Icon
                name="ChatSolid"
                size={16}
                fill="#111111"
                className="mr-2"
              />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <p>
            Resend OTP in <span className="font-semibold">{timer}s</span>
          </p>
          {showForceResend && onForceResend && (
            <Button
              variant="tertiary"
              onClick={onForceResend}
              className="text-zostel-light-text-primary text-sm mt-1"
            >
              Request New OTP
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const Login: React.FC<LoginProps> = ({ mobile, setMobile, operatorName }) => {
  const [otp, setOTP] = useState<string>("");
  const [isOTPSent, setOTPSent] = useState<boolean>(false);
  const [otpCount, setOtpCount] = useState<number>(0);
  const invalidOTPs = useRef<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<boolean>(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { login: loginZo } = useAuth();
  const { login: loginZostel } = useZostelAuth();
  const [timer, setTimer] = useState<number>(30);
  const [showResendOtp, setShowResendOtp] = useState<boolean>(false);
  const [isOTPRequested, setOTPRequested] = useState<boolean>(false);
  const { mutateAsync: requestOTP } = useMutationApi("AUTH_LOGIN_MOBILE_OTP");
  const { mutateAsync: activateZo } = useMutationApi("AUTH_LOGIN_MOBILE");
  const { mutateAsync: getZostelCreds } = useMutationApi(
    "AUTH_REQUEST_OTP_ZOSTEL"
  );
  const { mutateAsync: activateZostel } = useMutationApi("AUTH_ACTIVATE", {});

  const parsedMobile = useMemo(() => {
    try {
      if (isValidString(mobile)) {
        return parsePhoneNumber(`+${mobile}`);
      }
    } catch (error) {
      // Silent catch - will be handled by UI validation
      return undefined;
    }
  }, [mobile]);

  // Reset all OTP related state
  const resetOTPState = () => {
    setOTP("");
    setLoading(false);
    invalidOTPs.current = [];
    setOtpError(false);

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const handleNumberClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setOTPSent(false);
    setShowResendOtp(false);
    resetOTPState();
    setOtpCount(0);
  };

  const handleOTPRequest = async (messageChannel: string) => {

    if(isOTPRequested) return;
    setOTPRequested(true);

    const channel = messageChannel === "whatsapp" ? "whatsapp" : "";

    resetOTPState();

    try {
      if (typeof window === "undefined") return;

      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_KEY;
      if (!siteKey) {
        toast.error("Recaptcha site key missing.");
        return;
      }

      if (!window.grecaptcha) {
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (window.grecaptcha) {
              clearInterval(interval);
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(interval);
            toast.error("Recaptcha failed to load.");
          }, 5000);
        });
      }

      await new Promise<void>((resolve) => {
        window.grecaptcha.ready(resolve);
      });

      const token = await window.grecaptcha.execute(siteKey, {
        action: "request_otp",
      });

      const { data } = await requestOTP({
        data: {
          mobile_number: parsedMobile?.nationalNumber,
          mobile_country_code: parsedMobile?.countryCallingCode,
          message_channel: channel,
          captcha_response_token: token,
        },
      });

      if (data.success) {
        setOTPSent(true);
        setOtpCount((prev) => prev + 1);
        showToast("success", "OTP Sent Successfully");
        setTimer(30);
        setShowResendOtp(false);

        setTimeout(() => setShowResendOtp(true), otpCount === 0 ? 5000 : 0);
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setOTPRequested(false);
    }
  };

  const forceResendOTP = () => {
    // Reset timer to allow immediate resend
    setTimer(0);
    // Clear invalid OTPs when requesting new OTP
    invalidOTPs.current = [];
    setOtpError(false);
  };

  const handleOTPSubmit = (_code?: string) => {
    const _otp = _code || otp;

    // Only submit if not already loading and OTP isn't already known to be invalid
    if (isLoading || invalidOTPs.current.includes(_otp)) {
      if (invalidOTPs.current.includes(_otp)) {
        toast.error(
          "This OTP was already tried and is incorrect. Please try a different one."
        );
        setOTP("");
      }
      return;
    }

    setLoading(true);
    setOtpError(false);

    // Set a timeout to prevent indefinite loading state
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setLoading(false);
        toast.error("Request timed out. Please try again.");
      }
    }, 30000);

    activateZo(
      {
        data: {
          mobile_number: parsedMobile?.nationalNumber,
          mobile_country_code: parsedMobile?.countryCallingCode,
          otp: _otp,
        },
      },
      {
        onSuccess: (data) => {
          if (data.status === 200) {
            loginZo(data.data.user, data.data.token, data.data.valid_till);

            // Handle Zostel login
            getZostelCreds(
              { data: {} },
              {
                onSuccess: (creds) => {
                  activateZostel(
                    {
                      data: {
                        mobile: parsedMobile?.nationalNumber,
                        mobile_country_code: parsedMobile?.countryCallingCode,
                        otp: creds.data.code,
                      },
                    },
                    {
                      onSuccess: (zostelData) => {
                        loginZostel(
                          zostelData.data.user,
                          zostelData.data.user_token,
                          zostelData.data.token_expiry
                        );

                        // Clear loading timeout as login was successful
                        if (loadingTimeoutRef.current) {
                          clearTimeout(loadingTimeoutRef.current);
                          loadingTimeoutRef.current = null;
                        }
                      },
                      onError: () => {
                        // Even if Zostel login fails, the user can still use the app
                        // with limited functionality
                        toast.error(
                          "Zostel login failed. Some features may be limited."
                        );
                        setLoading(false);

                        if (loadingTimeoutRef.current) {
                          clearTimeout(loadingTimeoutRef.current);
                          loadingTimeoutRef.current = null;
                        }
                      },
                    }
                  );
                },
                onError: () => {
                  toast.error("Failed to get Zostel credentials.");
                  setLoading(false);

                  if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                    loadingTimeoutRef.current = null;
                  }
                },
              }
            );
          } else {
            toast.error("Login failed with unexpected response.");
            setLoading(false);

            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
          }
        },
        onError: (error) => {
          invalidOTPs.current.push(_otp);
          toast.error("Incorrect OTP. Please try again.");
          setOTP("");
          setLoading(false);
          setOtpError(true);

          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        },
      }
    );
  };

  useEffect(() => {
    if (isOTPSent && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [timer, isOTPSent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 py-8 justify-between">
      <div className="flex flex-col flex-1 gap-6">
        {!isOTPSent ? (
          <>
            <span className="text-zostel-light-text-primary body-text text-center">
              Web Check-in to {operatorName}
            </span>
            <span className="mobile-title text-zostel-light-text-primary text-center">
              Enter phone number
            </span>
            <PhoneInput className="my-6" value={mobile} onChange={setMobile} />
          </>
        ) : (
          <>
            <span className="text-zostel-light-text-primary mobile-title text-center">
              Enter the OTP sent to <br />
              <span className="flex items-center justify-center gap-2">
                {parsedMobile?.formatInternational()}
                <button className="cursor-pointer" onClick={handleNumberClick}>
                  <Icon name="Edit" size={24} fill="#111111" />
                </button>
              </span>
            </span>
            <div className="flex w-full my-6">
              <OtpInput
                value={otp}
                onChange={setOTP}
                length={6}
                autoFocus={true}
              />
            </div>
          </>
        )}
      </div>
      {isOTPSent ? (
        <div className="w-full">
          {showResendOtp && (
            <ResendOtp
              handleOTPRequest={handleOTPRequest}
              timer={timer}
              onForceResend={forceResendOTP}
              showForceResend={otpError}
            />
          )}
          {otp.length === 6 && (
            <Button
              onClick={() => handleOTPSubmit()}
              disabled={isLoading}
              fullWidth
              className="mt-6"
            >
              {isLoading ? "Please Wait ..." : "Next"}
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full">
          <div className="flex flex-col gap-2 mt-6">
            <Button
              variant="tertiary"
              fullWidth
              onClick={() => handleOTPRequest("whatsapp")}
              disabled={!parsedMobile || !parsedMobile.isValid()}
            >
              Request OTP on WhatsApp
            </Button>
            <Button
              fullWidth
              onClick={() => handleOTPRequest("")}
              disabled={!parsedMobile || !parsedMobile.isValid()}
            >
              Request OTP
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
