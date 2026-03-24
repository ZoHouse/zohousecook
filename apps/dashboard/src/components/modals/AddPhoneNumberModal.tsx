/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useResponseFlash } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { parsePhoneNumber } from "libphonenumber-js";
import React, { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import { Button } from "../common";
import MergeAccountModal from "./MergeAccountModal";

interface AddPhoneNumberModalProps {
  close: () => void;
  refetch: () => void;
}

type StepsType = "REQUEST_OTP" | "ENTER_OTP";

const AddPhoneNumberModal: React.FC<AddPhoneNumberModalProps> = ({
  close,
  refetch,
}) => {
  const [error, setError] = useResponseFlash();
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const [step, setStep] = useState<StepsType>("REQUEST_OTP");

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<number | string | undefined>("");

  const [showMergeAccountModal, setShowMergeAccountModal] =
    useState<boolean>(false);
  const [mergeData, setMergeData] = useState<GeneralObject>({});

  const { mutate: sendOtp } = useMutationApi("AUTH_REQUEST_OTP_MOBILE");
  const { mutate: verifyOtp } = useMutationApi("AUTH_USER_MOBILES");

  const handleRequestOtp: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!isValidString(phoneNumber)) {
      setError("Not a Valid Phone Number");
      return;
    }
    const mobileNumber = parsePhoneNumber(`+${phoneNumber}`);
    const data: GeneralObject = {
      mobile_number: mobileNumber.nationalNumber,
      mobile_country_code: mobileNumber.countryCallingCode,
    };

    sendOtp(
      { data: data },
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

    const mobileNumber = parsePhoneNumber(`+${phoneNumber}`);

    const data: GeneralObject = {
      mobile_country_code: mobileNumber.countryCallingCode,
      mobile_number: mobileNumber.nationalNumber,
      otp: +String(otp).replace("-", ""),
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
              authData: data,
              profile: error.response.data.merge_with,
            });
          } else if (error?.response?.data?.errors) {
            setError(error.response.data.errors.join(", "));
          }
        },
        onSuccess() {
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

  return (
    <>
      <div className="fixed inset-0 z-20 px-4 py-4 bg-zui-white bg-opacity-60 flex items-center justify-center">
        <div className="fixed inset-0" />
        <div className="max-w-lg w-full h-auto max-h-full overflow-y-visible bg-zui-black p-4 relative">
          <button
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 text-zui-white text-xl text-zui-black"
            onClick={close}
          >
            <Icon name="Cross" size={20} fill="#fff" />
          </button>
          <h4 className=" font-semibold mb-8 text-zui-violet text-3xl">
            Add Phone Number
          </h4>
          {isSuccess ? (
            <p className="text-lg">Phone Number Added Successfully.</p>
          ) : step === "REQUEST_OTP" ? (
            <form
              className="w-full flex flex-col space-y-4"
              onSubmit={handleRequestOtp}
            >
              <div className="flex flex-col items-start w-full">
                <label className="mb-4" htmlFor="name">
                  Phone Number
                </label>

                <PhoneInput
                  country={"in"}
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="+91 00000-00000"
                  searchPlaceholder="Search country"
                  containerClass="phone-number-container"
                  inputClass="phone-number-input"
                  buttonClass="phone-number-button"
                  dropdownClass="phone-number-dropdown"
                  enableSearch={true}
                />
              </div>
              <div />

              <Button
                icon="arrow-right"
                theme="light"
                fixedsize
                className="!bg-zui-violet self-start !text-zui-white"
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form
              className="w-full flex flex-col space-y-4"
              onSubmit={handleVerifyOtp}
            >
              <div className="flex flex-col items-start w-full">
                <label className="mb-4" htmlFor="name">
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
              <div />

              <Button
                disabled={String(otp).replace("-", "").length !== 6}
                icon="arrow-right"
                theme="light"
                fixedsize
                className="!bg-zui-violet self-start !text-zui-white"
              >
                Zo Zo Zo! Verify
              </Button>
            </form>
          )}
          {error != "" && (
            <span className="text-zui-red text-semibold absolute bottom-20">
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
          type="mobile"
          onSuccess={refetch}
        />
      )}
    </>
  );
};

export default AddPhoneNumberModal;
