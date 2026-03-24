/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import { isValidAddress, toChecksumAddress } from "@zo/utils/web3";
import React, { useState } from "react";
import { useLogin } from "../../hooks";
import { Button } from "../common";

interface FounderFriendsProps {}

const FounderFriends: React.FC<FounderFriendsProps> = () => {
  const { isLoggedIn } = useLogin();
  const { profile } = useProfile();
  const [whitelistedAddress, setWhitelistedAddress] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { data: whitelists, refetch: refetchWhitelists } = useQueryApi(
    "WEBTHREE_FOUNDER_ALLOWLIST",
    {
      enabled: isLoggedIn === true,
    },
    "",
    ""
  );

  const { mutate: addToWhitelist } = useMutationApi(
    "WEBTHREE_FOUNDER_ALLOWLIST",
    {},
    ""
  );

  const handleAddressSubmit = (e: any) => {
    e.preventDefault();
    if (
      profile?.membership === "founder" &&
      isValidString(whitelistedAddress) &&
      isValidAddress(whitelistedAddress)
    ) {
      addToWhitelist(
        { data: { wallet_address: toChecksumAddress(whitelistedAddress) } },
        {
          onSuccess: () => {
            setWhitelistedAddress("");
            refetchWhitelists();
          },
          onError(error, variables, context) {
            const e: any = error;
            if (e.response && e.response.data.errors) {
              setError(e.response.data.errors.join(" "));
            }
          },
        }
      );
    }
  };

  return (
    <>
      <div className="w-full bg-zui-orange border border-zui-orange flex flex-col mt-4 text-zui-black p-4 h-content md:h-[384px] overflow-hidden">
        <h3 className=" flex-shrink-0 font-bold text-5xl">Founder Friends</h3>
        {whitelists?.data?.results?.length !== 0 ? (
          <div className="flex-grow flex flex-col overflow-hidden mt-4">
            <p className="text-2xl flex-shrink-0 font-semibold w-5/6">
              Your friends will be able to
              <br />
              experience the Zo Zo!
            </p>
            <div className="flex flex-col mt-4 flex-grow overflow-y-auto">
              <div className="flex flex-col border-2 border-zui-black divide-y-2 divide-zui-black">
                {whitelists?.data?.results?.map((whitelist: GeneralObject) => (
                  <div
                    className="flex flex-col w-full"
                    key={whitelist.wallet_address}
                  >
                    <div className="flex items-center space-x-2 p-2">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/0/01/Ethereum_logo_translucent.svg"
                        className="w-6 h-6"
                        alt=""
                      />
                      <span className="font-medium text-sm truncate overflow-hidden">
                        {whitelist.wallet_address}
                      </span>
                    </div>
                    <div className="flex flex-col items-start p-2 w-full border-t-2 border-zui-black border-opacity-30">
                      {/* <div className="border-t border-dashed border-zui-black absolute left-14 right-14" /> */}
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-content h-content bg-zui-orange rounded-full">
                          {whitelist.registered ? (
                            <i className="uil uil-check-circle text-2xl" />
                          ) : (
                            <i className="uil uil-clock text-2xl" />
                          )}
                        </div>
                        <span>
                          Registration{" "}
                          {whitelist.registered ? "complete" : "pending"}
                        </span>
                      </div>
                      {whitelist.registered ? (
                        <div className="border-l-2 border-zui-black h-6 relative left-3" />
                      ) : (
                        <div className="border-l-2 border-dashed border-zui-black h-6 relative left-3" />
                      )}
                      <div
                        className={`flex items-center space-x-2 text-sm ${
                          !whitelist.registered && "opacity-40"
                        }`}
                      >
                        <div className="w-content h-content bg-zui-orange rounded-full">
                          {whitelist.twitter_verified ? (
                            <i className="uil uil-check-circle text-2xl" />
                          ) : (
                            <i className="uil uil-clock text-2xl" />
                          )}
                        </div>
                        <span>
                          Twitter{" "}
                          {whitelist.twitter_verified
                            ? "verified"
                            : "verification pending"}
                        </span>
                      </div>
                      {whitelist.twitter_verified ? (
                        <div className="border-l-2 border-zui-black h-6 relative left-3" />
                      ) : (
                        <div
                          className={`border-l-2 border-dashed border-zui-black h-6 relative left-3 ${
                            !whitelist.registered && "opacity-40"
                          }`}
                        />
                      )}
                      <div
                        className={`flex items-center space-x-2 text-sm ${
                          (!whitelist.registered ||
                            !whitelist.twitter_verified) &&
                          "opacity-40"
                        }`}
                      >
                        <div className="w-content h-content bg-zui-orange rounded-full">
                          {whitelist.status === 1 ? (
                            <i className="uil uil-clock text-2xl" />
                          ) : whitelist.status === 2 ? (
                            <i className="uil uil-check-circle text-2xl" />
                          ) : (
                            <i className="uil uil-times-circle text-2xl" />
                          )}
                        </div>
                        <span>
                          Allowlist{" "}
                          {whitelist.status === 1
                            ? "pending"
                            : whitelist.status === 2
                            ? "approved"
                            : "rejected"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col mt-4 justify-end">
            <p className="text-2xl font-semibold w-5/6">
              Invite one of your friend to
              <br />
              experience the Zo Zo!
              <br />
              Choose wisely.
            </p>
            <input
              name="name"
              className="border-2 placeholder:text-zui-black border-zui-black mt-4 bg-zui-orange w-full text-zui-black p-4 focus:outline-none"
              type="text"
              value={whitelistedAddress}
              onChange={(e) => setWhitelistedAddress(e.target.value)}
              placeholder="Web3 Address (eg. 0x1234...)"
              required
            />
            <Button
              fixedsize
              icon={profile?.membership !== "founder" ? "lock" : "arrow-right"}
              className="justify-between mt-4"
              iconClassName="text-2xl"
              onClick={handleAddressSubmit}
            >
              {profile?.membership !== "founder"
                ? "Only for Founder Members"
                : "Add"}
            </Button>
          </div>
        )}
      </div>
      {error !== "" && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 p-4 flex items-center justify-center">
          <div className="absolute inset-0" onClick={setError.bind(null, "")} />
          <div className="bg-black p-4 relative max-w-md w-full">
            <div className="flex flex-1 flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl font-bold text-start">Oh no!</span>
                <button
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                  onClick={setError.bind(null, "")}
                >
                  <i className="uil uil-times text-xl" />
                </button>
              </div>
              <p className="mt-4 capitalize">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FounderFriends;
