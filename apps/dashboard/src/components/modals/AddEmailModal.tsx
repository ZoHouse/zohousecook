/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useResponseFlash } from "@zo/utils/hooks";
import { isValidEmail } from "@zo/utils/string";
import React, { ChangeEvent, useEffect, useState } from "react";
import { Button } from "../common";
import MergeAccountModal from "./MergeAccountModal";

interface AddEmailModalProps {
  close: () => void;
  refetch: () => void;
}

type StepsType = "REQUEST_OTP" | "ENTER_OTP";

const AddEmailModal: React.FC<AddEmailModalProps> = ({ close, refetch }) => {
  const [error, setError] = useResponseFlash();
  const [isPromoChecked, setPromoChecked] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [step, setStep] = useState<StepsType>("REQUEST_OTP");
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<number | string | undefined>("");
  const [showMergeAccountModal, setShowMergeAccountModal] =
    useState<boolean>(false);
  const [mergeData, setMergeData] = useState<GeneralObject>({});

  const { mutate: sendOtp } = useMutationApi("AUTH_REQUEST_OTP_EMAIL");
  const { mutate: verifyOtp } = useMutationApi("AUTH_USER_EMAILS");

  const handleRequestOtp: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    sendOtp(
      { data: { email_address: email } },
      {
        onError: (error: any) => {
          if (error?.response?.data?.errors) {
            setError(error.response.data.errors.join(", "));
          }
        },
        onSuccess(data, variables, context) {
          setStep("ENTER_OTP");
        },
      }
    );
  };

  const handleVerifyOtp: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const data: GeneralObject = {
      verification_type: "native-email",
      email_address: email,
      otp: +String(otp).replace("-", ""),
      promotional: isPromoChecked,
    };
    verifyOtp(
      {
        data: data,
      },
      {
        onError: (error: any) => {
          if (error?.response?.status === 409) {
            setShowMergeAccountModal(true);
            setMergeData({
              mergeId: error.response.data.merge_id,
              authData: {
                verification_type: "native-email",
                email_address: email,
                otp: +String(otp).replace(/-/g, ""),
              },
              profile: error.response.data.merge_with,
            });
          } else {
            if (error?.response?.data?.errors) {
              setError(error.response.data.errors.join(", "));
            }
          }
        },
        onSuccess(data, variables, context) {
          setIsSuccess(true);
          refetch();
        },
      }
    );
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = e.target.value.replace(/\D/g, "");
    let formattedOtp = formattedValue.slice(0, 3);
    if (formattedValue.length > 3) {
      formattedOtp += "-" + formattedValue.slice(3, 6);
    }
    setOtp(formattedOtp);
  };

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetch();
        setTimeout(() => {
          close();
        }, 1000);
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const handleMergeModalClose = () => {
    setShowMergeAccountModal(false);
    close();
  };

  const toggleCheck = () => {
    setPromoChecked((c) => !c);
  };

  const onHandleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <>
      {" "}
      <div className="fixed inset-0 z-20 px-4 py-4 bg-zui-white bg-opacity-60 flex items-center justify-center">
        <div className="fixed inset-0" />
        <div className="max-w-lg w-full h-auto max-h-full overflow-y-auto bg-zui-black px-6 pt-4 pb-10 relative">
          <button
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 text-xl text-zui-black"
            onClick={close}
          >
            <Icon name="Cross" size={24} fill="#fff" />
          </button>
          <h4 className=" font-bold mb-2 text-zui-white text-5xl">Add Email</h4>
          {isSuccess ? (
            <p className="text-lg">Email Added Successfully.</p>
          ) : step === "REQUEST_OTP" ? (
            <form
              className="w-full flex flex-col space-y-4"
              onSubmit={handleRequestOtp}
            >
              <div className="flex flex-col items-start w-full">
                <label className="mb-4 text-base font-medium" htmlFor="name">
                  No spamming, only booking and transactional updates.
                </label>
                <div className="flex items-center gap-3 justify-start w-full py-6 px-4 bg-zui-light">
                  <Icon name="Email" size={24} fill="#5A5A5A" />
                  <input
                    name="email_address"
                    className="flex-1 text-zui-white text-base font-medium  h-full bg-transparent focus:outline-none placeholder-zui-silver"
                    type="email"
                    placeholder="bro@zo.xyz"
                    value={email}
                    autoComplete="off"
                    onChange={onHandleChange}
                  />
                </div>
              </div>
              <div />
              <Button
                theme="light"
                fixedsize
                className="!bg-zui-violet self-start !text-zui-white p-4 mt-6 font-bold text-base"
                disabled={!isValidEmail(email)}
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            <>
              <form
                className="w-full flex flex-col space-y-4"
                onSubmit={handleVerifyOtp}
              >
                <div className="flex flex-col items-start w-full">
                  <label className="mb-4" htmlFor="otp">
                    Enter OTP
                  </label>
                  <input
                    name="otp"
                    className="bg-zui-white w-full text-zui-black p-4 focus:outline-none"
                    type="text"
                    placeholder="000-000"
                    required
                    value={otp}
                    onChange={handleOtpInput}
                  />
                </div>
                <div className="mt-10">
                  <button
                    type="button"
                    onClick={toggleCheck}
                    className="flex items-center border-none bg-transparent cursor-pointer"
                  >
                    <Icon
                      name={isPromoChecked ? "CheckboxChecked" : "CheckBox"}
                      size={24}
                      fill={isPromoChecked ? "#CFFF50" : "#fff"}
                    />
                    <span className="ml-2">Receive community updates</span>
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={String(otp).replace("-", "").length !== 6}
                  icon="arrow-right"
                  theme="light"
                  fixedsize
                  className="!bg-zui-violet self-start mt-6 !text-zui-white"
                >
                  Zo Zo Zo! Verify
                </Button>
              </form>
            </>
          )}
          {error != "" && (
            <span className="text-zui-red text-semibold absolute bottom-2">
              {error}
            </span>
          )}
        </div>
      </div>
      {showMergeAccountModal && (
        <MergeAccountModal
          isOpen={showMergeAccountModal}
          onClose={handleMergeModalClose}
          mergeId={mergeData.mergeId}
          authData={mergeData.authData}
          mergingProfile={mergeData.profile}
          type="email"
          onSuccess={refetch}
        />
      )}
    </>
  );
};

export default AddEmailModal;
