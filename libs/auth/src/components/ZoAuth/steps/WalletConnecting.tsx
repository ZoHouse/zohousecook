import Icon from "@zo/assets/icons";
import { AuthUser } from "@zo/definitions/auth";
import { useInitialTimeout } from "@zo/utils/hooks";
import { FC, useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import useMutationApi from "../../../hooks/useMutationApi";
import { ZoAuthStepProps } from "../ZoAuth";

interface TokenGateCheckProps extends ZoAuthStepProps {
  login: (user: AuthUser, token: string, validTill: number) => void;
  onSuccess?: () => void;
}

const WalletConnecting: FC<TokenGateCheckProps> = ({
  setFocus,
  setStep,
  login,
  onSuccess,
}) => {
  useEffect(() => {
    setFocus("all");
  }, [setFocus]);

  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();
  const {
    mutate: loginWeb3,
    data,
    isSuccess,
  } = useMutationApi("AUTH_LOGIN_WEB3");
  const isReady = useInitialTimeout(3000);
  const [isSigned, setSigned] = useState<boolean>(false);

  useEffect(() => {
    if (data && data.status === 200) {
      login(data.data.user, data.data.token, data.data.valid_till);
      setStep("ONBOARDING_CHECK");
      onSuccess?.();
    }
  }, [data, login, setStep, onSuccess]);

  const sign = useCallback(async () => {
    await signMessage(
      {
        message: "Welcome To Zo World!",
      },
      {
        onSuccess: (signature) => {
          if (signature) {
            setSigned(true);
            loginWeb3({
              data: {
                wallet_address: address,
                message: "Welcome To Zo World!",
                signature: signature,
              },
            });
          }
        },
      }
    );
  }, [signMessage]);

  useEffect(() => {
    if (address && !isSigned) {
      (async () => {
        await sign();
      })();
    }
  }, [address, isSigned, sign]);

  return (
    <div className="flex flex-1 flex-col items-start">
      <span className="text-xl text-start">Wallet Connection Status</span>

      <div className="flex flex-col space-y-4 mt-8">
        {!isConnected ? (
          <div className="flex items-center space-x-4">
            <Icon name="Loader" size={16} className="animate-spin" />
            <span className="">Connecting to the wallet</span>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Icon name="CheckCircle" size={16} />
            <span className="">Connected</span>
          </div>
        )}
        {!isSigned ? (
          <div className="flex items-center space-x-4">
            <Icon name="Loader" size={16} className="animate-spin" />
            <span className="">Waiting for sign</span>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Icon name="CheckCircle" size={16} />
            <span className="">Signed</span>
          </div>
        )}
        {!isSuccess ? (
          <div className="flex items-center space-x-4">
            <Icon name="Loader" size={16} className="animate-spin" />
            <span className="">Waiting to verify</span>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Icon name="CheckCircle" size={16} />
            <span className="">Verified</span>
          </div>
        )}
      </div>
      {isReady && !isSigned && (
        <span className="text-sm mt-8">
          Issue in signing?{" "}
          <button className="underline font-bold" onClick={sign}>
            Click here to sign manually
          </button>
        </span>
      )}

      <span className="mt-auto text-sm my-4">
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

export default WalletConnecting;
