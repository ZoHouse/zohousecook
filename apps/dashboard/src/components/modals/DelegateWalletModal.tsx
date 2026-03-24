/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useResponseFlash } from "@zo/utils/hooks";
import React, { useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Button } from "../common";

interface DelegateWaletModalProps {
  close: () => void;
  refetch: () => void;
}

const DelegateWalletModal: React.FC<DelegateWaletModalProps> = ({
  close,
  refetch,
}) => {
  const { address } = useAccount();
  const [error, setError] = useResponseFlash();
  const { isConnected, connector } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const {
    mutate: submitForm,
    isLoading,
    isSuccess,
  } = useMutationApi("AUTH_USER_WEB3_WALLETS", {}, "delegate/");

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    const data: GeneralObject = {};
    const formdata = new FormData(e.currentTarget);
    formdata.forEach((value, key) => (data[key] = value));
    const signatureMessage = `Zo Zo Zo. Welcome to The Zo World.\nWe are happy to have you here.\n\nWallet address: ${address}\nDelegate Wallet: ${
      data.wallet_address
    }\nAt: ${new Date().toLocaleString()}`;
    const signature = await signMessageAsync({
      message: signatureMessage,
    });
    console.log(signature);
    if (signature) {
      submitForm(
        {
          data: {
            delegate_address: address,
            vault_address: data.wallet_address,
            signature,
            message: signatureMessage,
          },
        },
        {
          onError: (error: any) => {
            if (error?.response?.data?.errors) {
              setError(error.response.data.errors.join(", "));
            }
          },
        }
      );
    }
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

  return (
    <div className="fixed inset-0 z-20 px-4 py-4 bg-zui-white bg-opacity-60 flex items-center justify-center">
      <div className="fixed inset-0" />
      <div className="max-w-lg w-full h-auto max-h-full overflow-y-auto bg-zui-black p-4 relative">
        <button
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 text-zui-white text-xl text-zui-black"
          onClick={close}
        >
          <i className="uil uil-times text-zui-white" />
        </button>
        <h4 className=" font-semibold mb-8 text-zui-violet text-3xl">
          Add Delegate.cash Wallet
        </h4>
        {isSuccess ? (
          <p className="text-lg">Wallet Added Successfully.</p>
        ) : (
          <>
            <form
              className="w-full flex flex-col space-y-4"
              onSubmit={handleFormSubmit}
            >
              <div className="flex flex-col items-start w-full">
                <label className="mb-4" htmlFor="name">
                  Wallet Address
                </label>
                <input
                  name="wallet_address"
                  className="bg-zui-white w-full text-zui-black p-4 focus:outline-none"
                  type="text"
                  placeholder="Wallet Address"
                  required
                />
              </div>
              <div />
              {error != "" && (
                <span className="text-zui-red text-semibold absolute bottom-20">
                  {error}
                </span>
              )}
              <Button
                icon="arrow-right"
                theme="light"
                fixedsize
                isLoading={isLoading || isSigning}
                className="!bg-zui-violet self-start !text-zui-white"
              >
                Sign Message
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DelegateWalletModal;
