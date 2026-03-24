import { AuthUser } from "@zo/definitions/auth";
import { isValidEmail } from "@zo/utils/string";
import { useMutationApi } from "libs/auth/src/hooks";
import React, { useEffect, useState } from "react";
import { ZoAuthStepProps } from "../ZoAuth";

interface EmailLoginProps extends ZoAuthStepProps {
  login: (user: AuthUser, token: string, validTill: number) => void;
  onSuccess?: () => void;
}

const EmailLogin: React.FC<EmailLoginProps> = ({
  setFocus,
  setStep,
  login,
  onSuccess,
}) => {
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<number | string | undefined>();
  const [otpVerificationResponse, setOptVerificationResponse] = useState<
    string | null
  >(null);

  const [timer, setTimer] = useState<number>(30);
  const [isResendOtpButtonDisabled, setIsResendOtpButtonDisabled] =
    useState<boolean>(true);

  const { mutate: requestOtp } = useMutationApi("AUTH_LOGIN_EMAIL_OTP", {});
  const { mutate: verifyOtp } = useMutationApi("AUTH_LOGIN_EMAIL", {
    onError(error) {
      const customError = error as { response?: { status?: number } };

      if (customError.response && customError.response.status === 401) {
        setOptVerificationResponse("Invalid OTP");
      } else {
        setOptVerificationResponse("An Error Occured");
      }
    },
    onSuccess(data) {
      if (data && data.status === 200) {
        login(data.data.user, data.data.token, data.data.valid_till);
        setStep("ONBOARDING_CHECK");
        return;
      }
    },
  });
  const [emailLoginStep, setEmailLoginStep] = useState<
    "REQUEST_OTP" | "ENTER_OTP"
  >("REQUEST_OTP");

  const handleRequestOtp: React.MouseEventHandler<HTMLButtonElement> &
    React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (isValidEmail(email)) {
      requestOtp(
        { data: { email_address: email } },
        {
          onSuccess: () => {
            setEmailLoginStep("ENTER_OTP");
            setTimer(30);
            setIsResendOtpButtonDisabled(true);
          },
        }
      );
    }
  };

  const handleVerifyOtp: React.MouseEventHandler<HTMLButtonElement> &
    React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (email && otp) {
      verifyOtp(
        {
          data: {
            email_address: email,
            otp: +String(otp).replace("-", ""),
          },
        },
        {
          onSuccess: () => {
            if (onSuccess) {
              onSuccess();
            }
          },
        }
      );
    }
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = e.target.value.replace(/\D/g, "");
    let formattedOtp = formattedValue.slice(0, 3);
    if (formattedValue.length > 3) {
      formattedOtp += "-" + formattedValue.slice(3, 6);
    }
    setOtp(formattedOtp);
  };

  const renderEmailLoginFlow = () => {
    if (emailLoginStep === "REQUEST_OTP") {
      return (
        <>
          <h3>Your Email</h3>
          <input
            className={
              "p-4 bg-transparent border w-full border-zui-white text-zui-white caret-zui-silver placeholder:text-zui-silver focus:outline-none"
            }
            type="email"
            placeholder="Type here..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="outline-none flex py-4 justify-center bg-zui-white text-zui-dark w-full disabled:cursor-not-allowed disabled:bg-zui-white/70"
            onClick={handleRequestOtp}
            disabled={!isValidEmail(email)}
          >
            Send Verification Code
          </button>
        </>
      );
    }

    if (emailLoginStep === "ENTER_OTP") {
      return (
        <>
          <h3>Enter code sent to {email}</h3>
          <input
            className="p-4 bg-transparent border w-full border-zui-white text-zui-white caret-zui-silver placeholder:text-zui-silver focus:outline-none"
            type="text"
            placeholder="000-000"
            value={otp || ""}
            onChange={handleOtpInput}
          />
          {otpVerificationResponse && (
            <span className="text-xs text-zui-red">
              {otpVerificationResponse}
            </span>
          )}
          <button
            disabled={String(otp).replace("-", "").length !== 6}
            onClick={handleVerifyOtp}
            className="outline-none flex py-4 justify-center bg-zui-white text-zui-dark w-full disabled:cursor-not-allowed disabled:bg-zui-white/70"
          >
            Zo Zo Zo! Verify
          </button>

          <span className="text-sm">
            Didn't receive the code?{" "}
            {timer > 0 ? (
              <>
                <button
                  className="text-zui-neon cursor-not-allowed opacity-50"
                  disabled={true}
                >
                  Resend OTP
                </button>{" "}
                (00:{timer < 10 ? `0${timer}` : timer})
              </>
            ) : (
              <button
                className="text-zui-neon"
                onClick={handleRequestOtp}
                disabled={isResendOtpButtonDisabled}
              >
                Resend OTP
              </button>
            )}
          </span>
        </>
      );
    }
  };

  useEffect(() => {
    if (emailLoginStep === "ENTER_OTP") {
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
  }, [timer, emailLoginStep]);

  return (
    <form
      onSubmit={
        emailLoginStep === "REQUEST_OTP" ? handleRequestOtp : handleVerifyOtp
      }
      className="flex flex-col w-full items-start space-y-4 px-0"
    >
      {renderEmailLoginFlow()}
    </form>
  );
};

export default EmailLogin;
