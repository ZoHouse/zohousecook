import { AuthUser } from "@zo/definitions/auth";
import { logAxiosError } from "@zo/utils/auth";
import { useResponseFlash } from "@zo/utils/hooks";
import {
  isPossibleNumber,
  isValidNumber,
  parsePhoneNumber,
} from "libphonenumber-js";
import { MobileInput, OtpInputComponent } from "libs/moal/src";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useMutationApi } from "../../../hooks";
import { ZoAuthStepProps } from "../ZoAuth";
import { useZostelAuth } from "./../../../contexts/authZostel";

interface MobileLoginProps extends ZoAuthStepProps {
  isZostelLoginRequired?: boolean;
  login: (user: AuthUser, token: string, validTill: number) => void;
  onSuccess?: () => void;
}

const MobileLogin: React.FC<MobileLoginProps> = ({
  setStep,
  login,
  isZostelLoginRequired,
  onSuccess,
}) => {
  const router = useRouter();

  const { login: loginZostel } = useZostelAuth();
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");

  const [timer, setTimer] = useState<number>(30);
  const [isResendOtpButtonDisabled, setIsResendOtpButtonDisabled] =
    useState<boolean>(true);

  const [otpVerificationResponse, setOptVerificationResponse] =
    useResponseFlash();

  const { mutate: requestOtp } = useMutationApi("AUTH_LOGIN_MOBILE_OTP");
  const { mutate: getZostelCreds } = useMutationApi(
    "AUTH_REQUEST_OTP_ZOSTEL",
    {}
  );
  const { mutate: activateZostel } = useMutationApi("AUTH_ACTIVATE");
  const { mutate: verifyOtp } = useMutationApi("AUTH_LOGIN_MOBILE");

  const [mobileLoginStep, setMobileLoginStep] = useState<
    "REQUEST_OTP" | "ENTER_OTP"
  >("REQUEST_OTP");

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
        { data: data },
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
                              console.log("loginZostel", loginZostel);
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
            } else {
              console.log("verifyOtp success but status is not 200:", data);
            }
          },
          onError(error) {
            console.log("verifyOtp onError:", error);
            const customError = error as { response?: { status?: number } };

            if (customError.response && customError.response.status === 401) {
              setOptVerificationResponse("Invalid OTP");
            } else {
              setOptVerificationResponse("An Error Occurred");
            }
          },
        }
      );
    }
  };

  const handleNumberFormSubmit = () => {
    if (mobileNumber) {
      const phoneNumber = parsePhoneNumber(`+${mobileNumber}`);
      if (phoneNumber.isValid()) {
        const data = {
          mobile_number: phoneNumber.nationalNumber,
          mobile_country_code: phoneNumber.countryCallingCode,
        };
        requestOtp(
          { data: data },
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
  };

  const renderMobileLoginFlow = () => {
    if (mobileLoginStep === "REQUEST_OTP") {
      return (
        <OTPRequester
          mobileNumber={mobileNumber}
          setMobileNumber={setMobileNumber}
          handleNumberFormSubmit={handleNumberFormSubmit}
        />
      );
    }

    if (mobileLoginStep === "ENTER_OTP") {
      return (
        <OTPVerifier
          mobileNumber={mobileNumber}
          otp={otp}
          setOtp={setOtp}
          otpVerificationResponse={otpVerificationResponse}
          handleOTPFormSubmit={handleOTPFormSubmit}
          resendOtp={handleNumberFormSubmit}
          timer={timer}
          isResendOtpButtonDisabled={isResendOtpButtonDisabled}
        />
      );
    }
  };

  useEffect(() => {
    if (mobileLoginStep === "ENTER_OTP") {
      let interval: NodeJS.Timeout | undefined;

      if (timer > 0) {
        interval = setInterval(() => {
          setTimer((prevTimer) => prevTimer - 1);
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

  return (
    <div className="flex flex-col w-full items-start px-0">
      {renderMobileLoginFlow()}
    </div>
  );
};

const OTPRequester = ({
  mobileNumber,
  setMobileNumber,
  handleNumberFormSubmit,
}: {
  mobileNumber: string;
  setMobileNumber: React.Dispatch<React.SetStateAction<string>>;
  handleNumberFormSubmit: () => void;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // focus the first input field
      ref.current.querySelector("input")?.focus();
    }
  }, []);

  return (
    <div className="w-full space-y-4" ref={ref}>
      <h3>Your Mobile</h3>
      <MobileInput
        className="w-full"
        onEnterKeyPress={handleNumberFormSubmit}
        value={mobileNumber}
        setter={setMobileNumber}
      />

      <button
        type="submit"
        onClick={handleNumberFormSubmit}
        className="outline-none flex py-4 justify-center bg-zui-white text-zui-dark w-full disabled:cursor-not-allowed disabled:bg-zui-white/70"
        disabled={
          mobileNumber?.startsWith("91")
            ? !isValidNumber("+" + mobileNumber, "IN")
            : !isPossibleNumber("+" + mobileNumber)
        }
      >
        Send Verification Code
      </button>
    </div>
  );
};

const OTPVerifier = ({
  mobileNumber,
  otp,
  setOtp,
  otpVerificationResponse,
  handleOTPFormSubmit,
  resendOtp,
  isResendOtpButtonDisabled,
  timer,
}: {
  mobileNumber: string;
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  otpVerificationResponse: string;
  handleOTPFormSubmit: React.FormEventHandler<HTMLFormElement>;
  timer: number;
  resendOtp: () => void;
  isResendOtpButtonDisabled: boolean;
}) => {
  const ref = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (ref.current) {
      // focus the first input field
      ref.current.querySelector("input")?.focus();
    }
  }, []);

  return (
    <form
      className="flex flex-col w-full space-y-4"
      ref={ref}
      onSubmit={handleOTPFormSubmit}
    >
      <h3>
        Enter code sent to{" "}
        {parsePhoneNumber(`+${mobileNumber}`).formatInternational()}
      </h3>
      <OtpInputComponent value={otp} setter={setOtp} numInputs={6} />
      {otpVerificationResponse && (
        <span className="text-xs text-zui-red">{otpVerificationResponse}</span>
      )}
      <button
        type="submit"
        disabled={String(otp).replace("-", "").length !== 6}
        className="outline-none flex py-4 justify-center bg-zui-white text-zui-dark w-full disabled:cursor-not-allowed disabled:bg-zui-white/70"
      >
        Zo Zo Zo! Verify
      </button>

      <span className="text-sm">
        Didn't receive the code?{" "}
        <button
          className="text-zui-neon"
          onClick={resendOtp}
          disabled={isResendOtpButtonDisabled}
        >
          Resend OTP
        </button>{" "}
        (00:{timer < 10 ? `0${timer}` : timer})
      </span>
    </form>
  );
};

export default MobileLogin;