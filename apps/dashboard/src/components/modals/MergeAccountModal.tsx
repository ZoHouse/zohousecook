/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useMutationApi, useProfile } from "@zo/auth";
import { Avatar, Button } from "@zo/moal";
import { GeneralObject } from "@zo/definitions/general";
import { useResponseFlash } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { TextRadioButton } from "../ui";

interface MergeAccountModalProps {
  mergingProfile: GeneralObject;
  type: "email" | "mobile" | "web3";
  mergeId: string;
  authData: GeneralObject;
  onSuccess: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const MergeAccountModal: React.FC<MergeAccountModalProps> = ({
  isOpen,
  onClose = () => {},
  mergingProfile,
  type,
  mergeId,
  authData,
  onSuccess = () => {},
}) => {
  const [error, setError] = useResponseFlash();

  const { profile, refetchProfile, updateProfile } = useProfile();

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [selectedCustomNickname, setSelectedCustomNickname] = useState<string>(
    profile?.custom_nickname || ""
  );

  const { mutate: merge } = useMutationApi("AUTH_USER_MERGE", {}, `${type}/`);

  const mergeAccounts = () => {
    setLoading(true);
    merge(
      {
        data: {
          merge_id: mergeId,
          verification: authData,
        },
      },
      {
        onSuccess: () => {
          if (
            conflictingNicknames.length > 0 &&
            selectedCustomNickname !== profile?.custom_nickname
          ) {
            const updateData: GeneralObject = {
              custom_nickname: selectedCustomNickname,
            };
            if (
              isValidString(profile?.nickname) &&
              profile?.nickname === profile?.custom_nickname
            ) {
              updateData.selected_nickname = "custom";
            }
            updateProfile(
              { data: updateData },
              {
                onSuccess: () => {
                  setIsSuccess(true);
                  setLoading(false);
                  refetchProfile();
                  onSuccess();
                },
                onError: (error: any) => {
                  setLoading(false);
                  if (error?.response?.data?.errors) {
                    setError(error.response.data.errors.join(", "));
                  }
                },
              }
            );
          } else {
            setIsSuccess(true);
            setLoading(false);
            refetchProfile();
            onSuccess();
          }
        },
        onError: (error: any) => {
          setLoading(false);
          setIsSuccess(false);
          if (error?.response?.data?.errors) {
            setError(error.response.data.errors.join(", "));
          }
        },
      }
    );
  };

  const conflictingNicknames = useMemo(() => {
    if (mergingProfile && profile) {
      const options: Array<{ label: string; value: string }> = [];

      if (isValidString(mergingProfile.custom_nickname)) {
        options.push({
          label: mergingProfile.custom_nickname,
          value: mergingProfile.custom_nickname,
        });
      }
      if (isValidString(profile.custom_nickname)) {
        options.push({
          label: profile.custom_nickname,
          value: profile.custom_nickname,
        });
      }
      return options;
    }
    return [];
  }, [mergingProfile, profile]);

  const handleCustomNicknameSelection = (nickname: string) => {
    setSelectedCustomNickname(nickname);
  };

  return (
    <div className="fixed inset-0 z-40 px-4 py-4 bg-zui-white bg-opacity-60 flex items-center justify-center">
      <div className="fixed inset-0" />
      {isSuccess ? (
        <div className="max-w-lg h-[200px] w-full max-h-full overflow-y-auto bg-zui-dark relative flex items-center justify-center">
          <button
            className="absolute top-4 right-4 z-30 flex items-center justify-center w-8 h-8  text-xl text-zui-black"
            onClick={onClose}
          >
            <Icon name="Cross" size={20} fill="#fff" />
          </button>
          <h3 className="text-2xl">Successfully Merged Accounts.</h3>
        </div>
      ) : (
        <div className="max-w-lg w-full h-auto max-h-full overflow-y-auto bg-zui-dark relative space-y-6 p-6 pt-4">
          <button
            className="absolute top-4 right-4 z-30 flex items-center justify-center w-8 h-8  text-xl text-zui-black"
            onClick={onClose}
          >
            <Icon name="Cross" size={20} fill="#fff" />
          </button>
          <header className="text-2xl">
            Bro, I found an existing Zo account linked with{" "}
            {type === "email"
              ? mergingProfile?.email_address
              : formatAddress(mergingProfile?.wallet_address)}
          </header>

          <section className="divide-y divide-zui-light border border-zui-light bg-zui-lght ">
            <div className="flex justify-start items-center gap-4 p-4">
              <Avatar
                badgeSize={18}
                size={40}
                isFounder={mergingProfile?.membership}
                src={mergingProfile?.pfp_image}
              />
              <div className="text-sm">
                <h4 className="text-zui-white">
                  {mergingProfile?.custom_nickname ||
                    mergingProfile?.nickname ||
                    "Zo User"}
                </h4>
                <span className="text-zui-silver">
                  {isValidString(mergingProfile?.wallet_address)
                    ? formatAddress(mergingProfile?.wallet_address)
                    : isValidString(mergingProfile?.email_address)
                    ? mergingProfile?.email_address
                    : mergingProfile?.mobile_number}
                </span>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4 text-sm text-zui-silver">
              <Icon name="Info" size={28} fill="#5a5a5a" />
              <span>
                Created on{" "}
                {moment(mergingProfile?.created_at).format("DD MMM YYYY")} at{" "}
                {moment(mergingProfile?.created_at).format("LT")}
              </span>
            </div>
          </section>

          <section className="border-t border-zui-light py-4">
            <h3 className="text-lg">
              To Merge all your previous accounts into to this account, please
              select username you wish to keep
            </h3>
            <TextRadioButton
              className="mt-4"
              value={selectedCustomNickname}
              onSelect={handleCustomNicknameSelection}
              options={conflictingNicknames}
            />
          </section>
          {isValidString(error) && (
            <span className="text-zui-red text-sm m-4">{error}</span>
          )}

          {isLoading ? (
            <div className="">
              <Loader className="w-10 h-10 mx-auto" />
            </div>
          ) : (
            <Button
              onClick={mergeAccounts}
              disabled={!isValidString(selectedCustomNickname)}
              className=" w-full"
              type="primary"
            >
              Zo Zo Zo! Merge Accounts.
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MergeAccountModal;
