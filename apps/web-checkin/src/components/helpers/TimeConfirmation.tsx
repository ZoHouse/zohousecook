import { GeneralObject } from "@zo/definitions/general";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { AnimatePresence, motion } from "framer-motion";
import { showToast } from "libs/moal/src/utils";
import moment from "moment";
import Image from "next/image";
import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { CheckinStep } from "../../config/definitions";
import { AngleDown, Edit, GreenCheckCircle } from "../icons";
import { Button, DataDisplayList, TimeSelector } from "../ui";

interface TimeConfirmationProps {
  onSuccess: (data: GeneralObject) => void;
  user: GeneralObject;
  isRepeatUser: boolean;
  ids: GeneralObject[];
  isLoading: boolean;
  bookingCode: string;
  identifier: string;
  checkin: string;
  checkout: string;
  setStep: Dispatch<SetStateAction<CheckinStep>>;
}

const getProfileIncompleteFields = (user: Record<string, any>) => {
  const userProfileInfoFields: Record<string, string> = {
    first_name: "First Name",
    last_name: "Last Name",
    address: "Address",
    country: "Country",
    gender: "Gender",
    date_of_birth: "Date of Birth",
  };
  return Object.entries(userProfileInfoFields)
    .filter(([key]) => !user[key])
    .map(([, label]) => label);
};

const TimeConfirmation: React.FC<TimeConfirmationProps> = ({
  onSuccess,
  user,
  isRepeatUser,
  ids,
  isLoading,
  identifier,
  bookingCode,
  checkin,
  checkout,
  setStep,
}) => {
  const userData = useMemo(() => {
    if (!isRepeatUser || !user) {
      return null;
    } else {
      return [
        {
          icon: "🖋️",
          label: "First Name",
          value: user.first_name,
        },
        {
          icon: "🖋️",
          label: "Last Name",
          value: user.last_name,
        },
        {
          icon: "📬",
          label: "Email",
          value: user.email_address,
        },
        {
          icon: "📱",
          label: "Phone Number",
          value: user.mobile_number,
        },
        {
          icon: "🙋‍♂️",
          label: "Gender",
          value: formatCapitalize(user.gender),
        },
        {
          icon: "🎈",
          label: "Date of Birth",
          value: user.date_of_birth
            ? moment(user.date_of_birth).format("D MMM YYYY")
            : "N/A",
        },
        {
          icon: "🌏",
          label: "Country",
          value: user.country,
        },
        {
          icon: "🏠",
          label: "Address",
          value: user.address,
        },
      ];
    }
  }, [user, isRepeatUser]);

  const [timeOfArrival, setTimeOfArrival] = useState<string>("11:00 AM");
  const [comingFrom, setComingFrom] = useState<string>("");
  const [nextDestination, setNextDestination] = useState<string>("");
  const [isGovIdCollapsed, setIsGovIdCollapsed] = useState(false);

  const isFormValid = useMemo(() => {
    return (
      isValidString(timeOfArrival) &&
      isValidString(comingFrom) &&
      isValidString(nextDestination)
    );
  }, [timeOfArrival, comingFrom, nextDestination]);

  const handleSubmit = () => {
    // Convert 12-hour format to 24-hour format for submission
    let formattedTime = "";
    if (timeOfArrival) {
      const timeParts = timeOfArrival.match(/(\d+):(\d+)\s(AM|PM)/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = timeParts[2];
        const period = timeParts[3].toUpperCase();

        // Convert to 24-hour format
        if (period === "PM" && hours < 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }

        formattedTime = `${hours.toString().padStart(2, "0")}:${minutes}:00`;
      }
    }

    const data: GeneralObject = {
      booking_code: bookingCode === "anonymous-checkin" ? "" : bookingCode,
      arrival_time: formattedTime,
      next_destination: nextDestination,
      coming_from: comingFrom,
    };

    if (checkin) {
      data.arrival_on = moment(checkin).format("YYYY-MM-DD");
    } else {
      data.arrival_on = moment().format("YYYY-MM-DD");
    }

    if (checkout) {
      data.departure_on = moment(checkout).format("YYYY-MM-DD");
    }

    const incompleteProfileFields = getProfileIncompleteFields(user);
    if (incompleteProfileFields.length) {
      showToast(
        "error",
        `Please complete the following fields: ${incompleteProfileFields.join(
          ", "
        )}`
      );
      return;
    }

    onSuccess(data);
  };

  const handleBasicInfoEdit = () => {
    setStep("basic-info");
  };

  const handleEditGovId = () => {
    setStep("upload-ids");
  };

  return (
    <div className="thin-scrollbar">
      <div className="flex items-center justify-between py-2">
        <div>
          <h2 className="text-zostel-light-text-primary font-semibold text-xl">
            Time of Arrival
            <span className="text-zostel-common-error text-sm -mt-4 ml-1">
              *
            </span>
          </h2>
          <p className="text-sm text-zostel-light-text-secondary font-medium">
            Helps us prepare your room
          </p>
        </div>
        <TimeSelector value={timeOfArrival} onSubmit={setTimeOfArrival} />
      </div>
      <hr />
      <div className="flex flex-col items-start justify-between py-2">
        <div>
          <h2 className="text-zostel-light-text-primary font-semibold text-xl">
            Coming From
            <span className="text-zostel-common-error text-sm -translate-y-2 ml-1">
              *
            </span>
          </h2>
          <p className="text-sm text-zostel-light-text-secondary font-medium">
            Required as per government rules
          </p>
        </div>
        <input
          className="w-full h-14 bg-zostel-light-background-secondary rounded-xl px-4 mt-2"
          type="text"
          value={comingFrom}
          onChange={(e) => setComingFrom(e.target.value)}
          placeholder="Delhi"
        />
      </div>
      <hr />
      <div className="flex flex-col items-start justify-between py-2 mb-6">
        <div>
          <h2 className="text-zostel-light-text-primary font-semibold text-xl">
            Next Destination
            <span className="text-zostel-common-error text-sm -translate-y-2 ml-1">
              *
            </span>
          </h2>
          <p className="text-sm text-zostel-light-text-secondary font-medium">
            Get travel recommendations for your next stop!
          </p>
        </div>
        <input
          className="w-full h-14 bg-zostel-light-background-secondary rounded-xl px-4 mt-2"
          type="text"
          value={nextDestination}
          onChange={(e) => setNextDestination(e.target.value)}
          placeholder="San Francisco"
        />
      </div>

      {userData && isRepeatUser && (
        <>
          <hr />
          <DataDisplayList
            collapsable={true}
            className="my-6"
            onEdit={handleBasicInfoEdit}
            title={
              <div className="flex items-center gap-2">
                Basic Info
                <GreenCheckCircle />
              </div>
            }
            data={userData}
          />
          <hr />
          <div className="my-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 section-title">
                Gov. ID
                <GreenCheckCircle />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleEditGovId}>
                  <Edit />
                </button>
                <button onClick={() => setIsGovIdCollapsed(!isGovIdCollapsed)}>
                  <motion.div
                    animate={{ rotate: isGovIdCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AngleDown />
                  </motion.div>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isGovIdCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="w-full aspect-square relative rounded-2xl overflow-hidden border-2 border-zostel-light-stroke-primary">
                      <Image
                        src={ids[0].file}
                        alt="ID-front"
                        width={100}
                        height={100}
                        className="h-full w-full object-cover"
                        priority
                      />
                    </div>
                    <div className="w-full aspect-square relative rounded-2xl overflow-hidden border-2 border-zostel-light-stroke-secondary">
                      <Image
                        src={ids[1].file}
                        alt="ID-back"
                        width={100}
                        height={100}
                        className="h-full w-full object-cover"
                        priority
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <span>Number:</span>
                      <strong>{identifier || "N/A"}</strong>
                    </div>

                    <GreenCheckCircle />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <Button
        isLoading={isLoading}
        className="mt-6"
        fullWidth
        onClick={handleSubmit}
        disabled={!isFormValid}
      >
        Finish Check-in
      </Button>
    </div>
  );
};

export default TimeConfirmation;
