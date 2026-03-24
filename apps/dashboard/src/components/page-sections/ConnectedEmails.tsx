/* eslint-disable @typescript-eslint/no-empty-interface */
import Icon from "@zo/assets/icons";
import { useAuth, useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import moment from "moment";
import { FC, useState } from "react";
import { AuthEmail } from "../../config";
import { primarySorter } from "../../utils";
import { AddEmailModal } from "../modals";

interface ConnectedEmailsProps {}

const ConnectedEmails: FC<ConnectedEmailsProps> = () => {
  const { isLoggedIn } = useAuth();

  const { data: userEmails, refetch } = useQueryApi(
    "AUTH_USER_EMAILS",
    { enabled: isLoggedIn === true },
    "",
    ""
  );

  const [isAddingEmail, setAddingEmail] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleConnectModalClose = () => {
    setAddingEmail(false);
  };

  return (
    <div className="w-full bg-zui-violet flex flex-col overflow-hidden text-zui-white p-4 h-[500px] md:h-[420px] mt-4 md:mt-0">
      <h3 className="flex-shrink-0 font-bold text-5xl">Connected Emails</h3>
      <div className="w-full flex flex-1 mt-4 overflow-y-auto flex-col space-y-4">
        {(userEmails?.data.emails || [])
          .sort(primarySorter)
          .map((email: AuthEmail) => (
            <EmailCard
              key={email.email_address}
              email={email}
              refetch={refetch}
            />
          ))}
      </div>
      <div className="flex flex-col md:flex-row flex-shrink-0 space-y-4 md:space-y-0 md:space-x-4 mt-4">
        <button
          className="flex-shrink-0 flex items-center space-x-2"
          onClick={setAddingEmail.bind(null, true)}
          disabled={isAddingEmail}
        >
          {isAddingEmail ? (
            <span className="font-semibold">Please Wait...</span>
          ) : (
            <>
              <Icon name="Plus" size={24} fill="#fff" />
              <span className="font-semibold">Add Email</span>
            </>
          )}
        </button>
      </div>
      {isAddingEmail && (
        <AddEmailModal close={handleConnectModalClose} refetch={refetch} />
      )}
      {error !== "" && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 p-4 flex items-center justify-center">
          <div className="absolute inset-0" onClick={setError.bind(null, "")} />
          <div className="bg-black p-4 relative max-w-xl w-full">
            <div className="flex flex-1 flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <span className="text-xl text-start">Oh no!</span>
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
    </div>
  );
};

const EmailCard: FC<{ email: AuthEmail; refetch: () => void }> = ({
  email,
  refetch,
}) => {
  const { refetchProfile } = useProfile();

  const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);

  const { mutate: deleteEmail } = useMutationApi(
    "AUTH_USER_EMAILS",
    {},
    "",
    "DELETE"
  );
  const { mutate: updateEmail } = useMutationApi(
    "AUTH_USER_EMAILS",
    {},
    "",
    "PUT"
  );

  const handleRemoveWallet = () => {
    deleteEmail(
      {
        data: { email_address: email.email_address },
      },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };

  const handleSetPrimary = () => {
    updateEmail(
      {
        data: { email_address: email.email_address, primary: true },
      },
      {
        onSuccess: () => {
          refetch();
          setDropdownVisible(false);
        },
      }
    );
  };

  const toggleDropDown = () => {
    setDropdownVisible((v) => !v);
  };

  return (
    <div className="flex flex-col relative p-3 w-full border-2 border-zui-black">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {email?.primary && (
            <span className="text-xs font-semibold uppercase bg-zui-magenta text-zui-black p-2">
              primary
            </span>
          )}
          {email?.verified && (
            <span className="text-xs font-semibold uppercase bg-zui-green text-zui-black p-2">
              verified
            </span>
          )}
        </div>
        {!email?.primary && (
          <>
            <button
              className="text-black w-8 h-8 hover:border-zui-black active:bg-black focus:border-zui-black border-2 border-zui-violet active:text-zui-white flex items-center justify-center"
              onClick={toggleDropDown}
            >
              <Icon name="More" size={30} fill="#000" />
            </button>
            {isDropdownVisible && (
              <ul className="absolute z-10 top-[12px] right-[12px] bg-black flex flex-col items-start divide-y divide-zui-white border border-zui-white">
                <li
                  className="p-2 pr-8 whitespace-nowrap text-zui-white w-full flex items-center justify-start cursor-pointer"
                  onClick={handleSetPrimary}
                >
                  Make Primary
                </li>
                <li
                  className="p-2 pr-8 whitespace-nowrap w-full flex items-center justify-start cursor-pointer text-zui-red"
                  onClick={handleRemoveWallet}
                >
                  Remove
                </li>
              </ul>
            )}
          </>
        )}
      </div>
      <div className="flex items-start">
        <i className="uil uil-wallet text-2xl" />
        <div className="flex flex-col ml-2">
          <span className="">{email.email_address}</span>
          <span className="text-sm">
            Connected on {moment(email?.created_at).format("LLL")}
          </span>
        </div>
      </div>
      {isDropdownVisible && (
        <div className="fixed inset-0" onClick={toggleDropDown} />
      )}
    </div>
  );
};

export default ConnectedEmails;
