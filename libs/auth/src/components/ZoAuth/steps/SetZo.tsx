/* eslint-disable @typescript-eslint/no-explicit-any */
import { useResponseFlash } from "@zo/utils/hooks";
import { FC, useEffect, useState } from "react";
import useProfile from "../../../hooks/useProfile";
import { ZoAuthStepProps } from "../ZoAuth";

const SetZo: FC<ZoAuthStepProps> = ({ setFocus, setStep }) => {
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const { isLoading, refetchProfile, updateProfile } = useProfile();
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useResponseFlash();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateProfile(
      {
        data: { custom_nickname: nickname.toLowerCase() + ".zo" },
      },
      {
        onSuccess: () => {
          refetchProfile();
          setStep("ONBOARDING_CHECK");
        },
        onError: (error: any) => {
          console.log(error.response);
          if (error.response.status === 422) {
            setError(
              error?.response?.data?.errors?.custom_nickname ||
                "Something went wrong."
            );
          }
        },
      }
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start w-full overflow-hidden">
      <h4 className="text-xl text-start">Choose your .zo nickname</h4>
      <div className="w-full mt-4 flex-1 overflow-hidden flex flex-col">
        <form
          className="w-full flex flex-col items-start space-y-4"
          onSubmit={handleFormSubmit}
        >
          <div className="flex items-stretch justify-start w-full">
            <input
              name="nickname"
              className="bg-zui-white w-full text-zui-zui-dark p-3 focus:outline-none"
              type="text"
              placeholder="sexyusername"
              pattern="^[a-zA-Z0-9]{6,32}$"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              title="Nickname should be 6 to 32 characters long and should only contain alphanumeric characters."
              required
            />
            <span className="bg-zui-white flex items-center justify-center text-zui-zui-dark px-3">
              .zo
            </span>
          </div>
          {error && (
            <span className="text-zui-red text-sm my-4 capitalize">
              {error}
            </span>
          )}
          <div className="flex items-start flex-col my-4 flex-shrink-0">
            <button className="flex px-8 py-4 bg-zui-white text-zui-dark">
              Let's Go
            </button>
          </div>
        </form>
      </div>

      <span className="mt-auto flex-shrink-0 text-sm my-4">
        In case of any issue, raise a ticket on{" "}
        <a
          className="underline font-semibold hover:text-[#7289DA] cursor-pointer"
          href="https://discord.gg/zoworld"
          rel="noreferrer"
          target="_blank"
        >
          our discord
        </a>
        .
      </span>
    </div>
  );
};

export default SetZo;
