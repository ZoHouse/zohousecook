import { useAuth, useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString, isValidUUID } from "@zo/utils/string";
import { showToast } from "libs/moal/src/utils";
import { InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MetaTags, Page } from "../../components/common";
import { Button, Chip } from "../../components/ui";
import { Poa, PoaDropStatus } from "../../config";

import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";

import { fetchMetaData as getServerSideProps } from "../../components/utils";
export { getServerSideProps };

const statusToColorMap: {
  [key: string]: string;
} = {
  pending: "text-zui-yellow",
  initiated: "text-zui-yellow",
  success: "text-zui-green",
  failed: "text-zui-red",
  waiting: "text-zui-silver",
};

const Airdrop: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  const router = useRouter();
  const { showLoginModal, isLoggedIn, user } = useAuth();

  const isStatusCheckPinging = useRef<boolean>(false);
  const statusPingInterval = useRef<any>(null);

  const [statusChecking, setStatusChecking] = useState<boolean>(false);

  const { mutate: createPoadrop } = useMutationApi("WEBTHREE_POA");

  const { data: poaDetails, isLoading: isLoadingPoaDetails } = useQueryApi<Poa>(
    "WEBTHREE_POA",
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
      enabled: isValidUUID(router.query.slug),
    },
    `${router.query.slug}/`
  );

  const { data: poaDropStatus, refetch: refetchStatus } =
    useQueryApi<PoaDropStatus>(
      "WEBTHREE_POA",
      {
        refetchOnWindowFocus: false,
        select: (data) => data.data,
        enabled:
          isValidUUID(router.query.slug) && isValidString(user?.wallet_address),
      },
      `${router.query.slug}/status/`,
      `wallet_address=${user?.wallet_address}`
    );

  const handleAirdrop = () => {
    if (!isLoggedIn || !user) {
      showToast("warning", "Please Login.");
      return;
    }
    if (!isValidUUID(router.query.slug)) {
      showToast("warning", "Not a Valid POA Id.");
      return;
    }

    createPoadrop(
      {
        data: {
          wallet_address: user.wallet_address,
        },
        route: `${router.query.slug}/claim/`,
      },
      {
        onSuccess(data) {
          startStatusPinging();
        },
        onError(error) {
          showToast("error", processResponseError(error));
        },
      }
    );
  };

  const isUserAllowedtoAirDrop = useMemo(() => {
    if (!poaDetails) {
      return [false, "Not a collection"];
    }

    if (poaDetails.status.toLowerCase() !== "active") {
      return [false, "Contract is not active."];
    }

    return [true, "Airdrop Available"];
  }, [poaDetails, poaDropStatus, user]);

  const startStatusPinging = () => {
    isStatusCheckPinging.current = true;
    statusPingInterval.current = setInterval(refetchStatus, 5000);
    setStatusChecking(true);
  };

  const cancelStatusPinging = () => {
    isStatusCheckPinging.current = false;
    if (isStatusCheckPinging.current) {
      clearInterval(statusPingInterval.current);
    }
  };

  useEffect(() => {
    if (statusChecking && poaDropStatus) {
      if (["success", "failed", "cancelled"].includes(poaDropStatus.status)) {
        cancelStatusPinging();
      }
    }
  }, [poaDropStatus, statusChecking]);

  return (
    <Page className="lg:pt-24">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <section className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center h-fit w-full md:w-1/3 md:min-w-[336px] space-y-6 relative bg-zui-lighter border border-zui-stroke mx-auto px-4 py-10 rounded-2xl">
          <Chip text="Airdrop" className="w-fit mx-auto" />
          {
            <h1 className="sub-heading-2 text-center">
              Claim POA{" "}
              <span className="text-zui-yellow">
                {formatCapitalize(
                  poaDetails?.title
                    ? `for ${poaDetails.title.slice(0, 10)}...`
                    : ""
                )}
              </span>
            </h1>
          }

          {isLoggedIn ? (
            poaDetails ? (
              <>
                <div className="relative z-10">
                  <h2 className="w-2/3 text-sm px-4 py-3 border border-zui-silver rounded-full truncate mx-auto bg-zui-light">
                    {user?.wallet_address}
                  </h2>
                  {statusChecking || isValidObject(poaDropStatus?.poa) ? (
                    <div className="rounded-xl border border-zui-stroke text-center mt-10 px-4 py-3 w-2/3 mx-auto">
                      Fetching Status... <br />
                      <span
                        className={cn(
                          "",
                          statusToColorMap[
                            poaDropStatus?.status as keyof typeof statusToColorMap
                          ] || statusToColorMap["waiting"]
                        )}
                      >
                        {formatCapitalize(
                          poaDropStatus?.status || "Waiting..."
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 h-full mt-10 flex flex-col items-center justify-between">
                      <Button
                        showEffect={true}
                        type="primary"
                        onClick={handleAirdrop}
                        disabled={!isUserAllowedtoAirDrop[0]}
                      >
                        Get Airdrop
                      </Button>

                      <label
                        className={cn(
                          "justify-self-end mt-20",
                          isUserAllowedtoAirDrop[0]
                            ? "text-zui-green"
                            : "text-zui-red"
                        )}
                      >
                        {isUserAllowedtoAirDrop[1]} <br />
                      </label>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1">
                {isLoadingPoaDetails ? (
                  <div className="text-center text-zui-silver">
                    Loading Poa Details
                  </div>
                ) : (
                  <div className="text-center">
                    <h4 className="sub-heading-3">Not a valid POA Link.</h4>
                    <span className="">
                      <p className="text-zui-silver mb-4">
                        Please Check the link
                      </p>
                      <Link href={"/"} className="text-sm">
                        Go Home
                      </Link>
                    </span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex justify-center items-center flex-1">
              {poaDetails && (
                <ul>
                  {Object.keys(poaDetails).map((key: string) => (
                    <li className="text-zui-white">
                      <strong>{key}:</strong>{" "}
                      {String(
                        poaDetails[key as keyof typeof poaDetails] || "-"
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Button
                showEffect={true}
                type="primary"
                onClick={showLoginModal.bind(null, ["wallet"])}
              >
                Connect Your Wallet
              </Button>
            </div>
          )}
        </div>
      </section>
    </Page>
  );
};

export default Airdrop;
