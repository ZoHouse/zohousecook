import { PDFDownloadLink } from "@react-pdf/renderer";
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  Button,
  DataList,
  DataListDisplay,
  FormElement,
  Sidebar,
} from "@zo/moal";
import { useResponseFlash } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { Tooltip } from "antd";
import { parsePhoneNumber } from "libphonenumber-js";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { getGender, getStatus } from "../../utils";
import { GovermentIds } from "../helpers/booking-info";
import { CheckinPDF } from "../ui";

interface CheckinInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  checkin: GeneralObject;
  isRefetchingCheckin: boolean;
  isLoadingCheckin: boolean;
  refetchCheckin: () => void;
}

const CheckinInfoSidebar: React.FC<CheckinInfoSidebarProps> = ({
  isOpen,
  onClose,
  checkin,
  isLoadingCheckin,
  isRefetchingCheckin,
  refetchCheckin,
}) => {
  const [bookingCode, setBookingCode] = useState<string>("");
  const [searchedBooking, setSearchedBooking] = useState<GeneralObject>({});
  const [isBookingSearchError, setBookingSearchError] = useResponseFlash();

  const { refetch: fetchBooking, remove: removeSearchedBooking } =
    useQueryApi<GeneralObject>(
      "ADMIN_PM_BOOKINGS",
      {
        enabled: false,
        retry: false,
        onSuccess: (data) => {
          if (data.data) {
            const totalOccupancy = data.data.rooms.reduce(
              (acc: number, room: GeneralObject) => acc + room.units,
              0
            );
            const totalCheckins = data.data.checkins.length;
            if (totalCheckins < totalOccupancy) {
              setSearchedBooking(data.data);
            } else {
              setBookingSearchError("The booking is fully checked-in.");
            }
          } else {
            setBookingSearchError(
              "Either the booking is invalid or can't be added to this check-in."
            );
          }
        },
        onError: () => {
          setBookingSearchError(
            "Either the booking is invalid or can't be added to this check-in."
          );
        },
      },
      `${bookingCode}/`
    );

  const { mutate: updateCheckin, isLoading: isUpdatingCheckin } =
    useMutationApi("ADMIN_PM_CHECKIN", {}, "", "PUT");

  const stayInfo: DataList[] = useMemo(() => {
    const bookingToShow = isValidObject(searchedBooking)
      ? searchedBooking
      : isValidObject(checkin?.booking)
      ? checkin.booking
      : {};
    const stayData: DataList[] = isValidObject(bookingToShow)
      ? [
          {
            id: "booking-info",
            title: "",
            data: [
              {
                id: "code",
                content: `Booking Code: ${bookingToShow.code}`,
                icon: "Id",
              },
              {
                id: "status",
                content: `Status: ${getStatus(bookingToShow.status)}`,
                icon: "Info",
              },
              {
                id: "checkin",
                content: `Check-in: ${moment(bookingToShow.start_date).format(
                  "DD MMM"
                )}`,
                icon: "Checkin",
              },
              {
                id: "staying-from",
                content: `Check-out: ${moment(bookingToShow.end_date).format(
                  "DD MMM"
                )}`,
                icon: "CheckOut",
              },
              {
                id: "stay",
                content: `${bookingToShow.rooms
                  .map((r: GeneralObject) =>
                    r.units > 1 || bookingToShow.rooms.length > 1
                      ? `${r.name} x ${r.units}`
                      : r.name
                  )
                  .join(", ")}`,
                icon: "Dorm",
              },
              {
                id: "source",
                content: `Source: ${bookingToShow.source?.name || "N/A"}`,
                icon: "Ticket",
              },
              {
                id: "booked_on",
                content: `Booked on ${
                  bookingToShow?.time_create
                    ? moment(bookingToShow.time_create).format(
                        "D MMM YYYY, h:mm A"
                      )
                    : "N/A"
                }`,
                icon: "Clock",
              },
            ],
          },
        ]
      : [];

    return stayData;
  }, [checkin.booking, searchedBooking]);

  const personalInfo: DataList[] = useMemo(
    () =>
      isValidObject(checkin)
        ? [
            {
              id: "personal-info",
              title: "",
              data: [
                {
                  id: "email",
                  content: checkin.profile.email,
                  icon: "Email",
                },
                {
                  id: "phone",
                  content: parsePhoneNumber(
                    `+${checkin.profile.mobile}`
                  ).formatInternational(),
                  icon: "Phone",
                },
                {
                  id: "gender",
                  content: `Gender: ${getGender(checkin.profile.gender)}`,
                  icon: "Username",
                },
                {
                  id: "address",
                  content: `Address: ${checkin.profile.address}`,
                  icon: "Location",
                },
                {
                  id: "arrival_on",
                  content: (() => {
                    // Parse the arrival date string. Explicitly state format for robustness.
                    const dateMoment = moment(checkin.arrival_on, "YYYY-MM-DD");

                    // Default result is the formatted date part.
                    // If dateMoment is invalid (e.g., checkin.arrival_on is malformed),
                    // .format() will produce "Invalid date".
                    let resultString = `Arrival on ${dateMoment.format(
                      "DD MMM YYYY"
                    )}`;

                    if (checkin.arrival_time) {
                      // If arrival_time is provided, attempt to combine it with the arrival_on date.
                      // checkin.arrival_on is expected to be in 'YYYY-MM-DD' format.
                      // checkin.arrival_time is expected to be in 'HH:mm:ss' format.
                      const fullDateTimeStr = `${checkin.arrival_on}T${checkin.arrival_time}`;

                      // moment will parse YYYY-MM-DDTHH:mm:ss as local time by default.
                      const arrivalDateTimeMoment = moment(fullDateTimeStr);

                      if (arrivalDateTimeMoment.isValid()) {
                        // If the combined date and time string parses into a valid moment object,
                        // format it to include both date and time.
                        resultString = `Arrival on ${arrivalDateTimeMoment.format(
                          "DD MMM YYYY, h:mm A"
                        )}`;
                      }
                      // If arrivalDateTimeMoment is not valid (e.g., due to malformed arrival_time
                      // or if arrival_on was invalid), resultString will retain its date-only value
                      // (or "Invalid date" if arrival_on was invalid).
                    }

                    return resultString;
                  })(),
                  icon: "Clock",
                },
                {
                  id: "coming_from",
                  content: `Coming from ${checkin.coming_from}`,
                  icon: "Location",
                },
                {
                  id: "next_destination",
                  content: `Going to: ${checkin.next_destination}`,
                  icon: "Location",
                },
                {
                  id: "departure_time",
                  content: `Departure time: ${
                    checkin.departure_time
                      ? moment(checkin.departure_time, "HH:mm:ss").format(
                          "h:mm A"
                        )
                      : ""
                  }`,
                  icon: "Clock",
                  isHidden: !checkin.departure_time,
                },
              ],
            },
          ]
        : [],
    [checkin]
  );

  const searchBooking = () => {
    fetchBooking();
  };

  const clearSearchedBooking = () => {
    setSearchedBooking({});
    removeSearchedBooking();
    setBookingCode("");
  };

  const confirmBooking = () => {
    updateCheckin(
      {
        data: {
          booking_code: searchedBooking?.code,
        },
        route: `${checkin.id}/`,
      },
      {
        onSuccess: () => {
          refetchCheckin();
          clearSearchedBooking();
        },
      }
    );
  };

  const approveCheckin = () => {
    updateCheckin(
      {
        data: {
          approved: true,
        },
        route: `${checkin.id}/`,
      },
      {
        onSuccess: refetchCheckin,
      }
    );
  };

  const comingText = useMemo(() => {
    const { booking, arrival_on, departure_on } = checkin;
    const today = moment();
    const arrivalDate = moment(arrival_on);
    const departureDate = moment(departure_on);
    if (checkin.booking?.status === "cancelled") {
      return "did not stay here";
    }
    if (today.isBefore(arrivalDate, "day")) {
      return "is coming soon";
    } else if (today.isAfter(arrivalDate, "day")) {
      if (today.isAfter(departureDate, "day")) {
        return "stayed here";
      } else {
        if (booking?.status === "checked-out") {
          return "stayed here";
        } else {
          return "is staying here";
        }
      }
    } else {
      if (booking?.status === "checked_in") {
        return "is staying here";
      } else {
        return "is arriving today";
      }
    }
  }, [checkin]);

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={onClose}
      scrollableChildren={false}
      className="flex flex-col !px-0 overflow-hidden"
    >
      {!isLoadingCheckin ? (
        <div className="flex-1 flex items-stretch overflow-hidden divide-x divide-zui-light">
          <div className="flex flex-col flex-1 divide-y divide-zui-light">
            <div className="p-6 md:pt-8 flex flex-col flex-shrink-0 gap-y-6">
              <div className="flex items-start gap-6 justify-between">
                <span className="text-xl md:text-2xl font-medium">
                  {checkin?.profile?.first_name}{" "}
                  {checkin?.profile?.last_name || ""} {comingText}
                </span>
                <div className="flex items-center gap-6 mt-1 md:mt-0">
                  <PDFDownloadLink
                    document={
                      <CheckinPDF
                        checkin={checkin}
                        stayInfo={searchedBooking}
                        assets={
                          (checkin?.approved
                            ? checkin?.data?.assets
                            : checkin?.profile?.assets) || []
                        }
                      />
                    }
                    fileName={`Checkin_${checkin?.profile?.full_name.replace(
                      /\s+/g,
                      "_"
                    )}`}
                  >
                    {({ loading }) => (
                      <Tooltip title="Download Checkin as PDF">
                        <button
                          className={
                            "flex items-center justify-center relative"
                          }
                        >
                          <Icon name="Download" size={24} fill="#FFF" />
                          {loading && (
                            <span className="flex items-center justify-center absolute inset-0 bg-zui-dark">
                              <Loader className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      </Tooltip>
                    )}
                  </PDFDownloadLink>
                  {isRefetchingCheckin ? (
                    <Loader className="w-5 h-5" />
                  ) : (
                    <Tooltip title="Refresh Checkin">
                      <button onClick={refetchCheckin}>
                        <Icon name="Refresh" size={20} fill="#FFF" />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip title="Close">
                    <button onClick={onClose}>
                      <Icon name="Cross" size={24} fill="#FFF" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                  <div className="flex flex-col items-start md:items-center md:flex-row gap-10 order-1 md:order-2">
                    <div className="flex flex-col items-start md:items-center md:flex-row gap-2">
                      <div className="flex items-center gap-2">
                        <span>Web Checkin</span>
                        {checkin.approved ? (
                          <Icon name="Check" size={16} fill="#66DF48" />
                        ) : (
                          <Icon name="Clock" size={16} fill="rgb(255,158,76)" />
                        )}
                      </div>
                      {checkin.checkin_at && (
                        <span className="text-sm text-zui-silver">
                          at {moment(checkin.checkin_at).format("LLL")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-center md:flex-row gap-2">
                      <div className="flex items-center gap-2">
                        <span>Checkin</span>
                        {checkin.booking?.status === "checked-in" ||
                        checkin.booking?.status === "checked_in" ||
                        checkin.booking?.status === "checked-out" ||
                        checkin.booking?.status === "checked_out" ? (
                          <Icon name="Check" size={16} fill="#66DF48" />
                        ) : (
                          <Icon name="Clock" size={16} fill="rgb(255,158,76)" />
                        )}
                      </div>
                      {(checkin.booking?.status === "checked-in" ||
                        checkin.booking?.status === "checked_in" ||
                        checkin.booking?.status === "checked-out" ||
                        checkin.booking?.status === "checked_out") &&
                        checkin.data?.property_checkin_at && (
                          <span className="text-sm text-zui-silver">
                            at{" "}
                            {moment(checkin.data?.property_checkin_at).format(
                              "LLL"
                            )}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid flex-1 overflow-y-auto divide-x divide-zui-light grid-cols-1 md:grid-cols-3">
              <div className="flex flex-col">
                <div className="flex items-center justify-between -mb-6 pt-6 px-6">
                  <p className="text-base font-semibold text-zui-silver uppercase">
                    {stayInfo.length > 0
                      ? isValidObject(searchedBooking)
                        ? "Is this the booking?"
                        : "Stay Info"
                      : "Add Booking to Check-in"}
                  </p>
                </div>
                {stayInfo.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    <DataListDisplay data={stayInfo} className="px-6" />
                    {isValidObject(searchedBooking) && (
                      <div className="flex flex-col gap-2 px-6">
                        <Button
                          onClick={confirmBooking}
                          isLoading={isUpdatingCheckin}
                        >
                          Yes, Confirm Booking
                        </Button>
                        <Button onClick={clearSearchedBooking} type="secondary">
                          No, Not this one
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form className="mt-10 px-6 flex flex-col gap-6">
                    <FormElement
                      label="Booking Code"
                      name="booking_code"
                      type="text"
                      value={bookingCode}
                      setValue={setBookingCode}
                    />
                    <Button
                      htmlType="button"
                      disabled={!isValidString(bookingCode.trim())}
                      onClick={searchBooking}
                    >
                      Fetch Booking
                    </Button>
                    {isBookingSearchError && (
                      <div className="flex items-start gap-2 -mt-2">
                        <Icon name="Info" size={24} fill="rgb(255,69,69)" />
                        <span className="text-sm text-zui-red relative top-0.5">
                          {isBookingSearchError}
                        </span>
                      </div>
                    )}
                  </form>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between -mb-6 pt-6 px-6">
                  <p className="text-base font-semibold text-zui-silver uppercase">
                    Personal Info
                  </p>
                </div>
                <DataListDisplay data={personalInfo} className="px-6" />
              </div>

              <GovermentIds
                areFieldsEditable={false}
                editPersonalInfo={() => {}}
                assets={
                  (checkin?.approved
                    ? checkin?.data?.assets
                    : checkin?.profile?.assets) || []
                }
              />
            </div>
            {!checkin.approved && (
              <div className="flex items-center justify-end p-6 pr-10 gap-6">
                <Button
                  className="flex-none"
                  onClick={approveCheckin}
                  isLoading={isUpdatingCheckin}
                >
                  Approve Check-in
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 relative">
          <button className="absolute right-6 top-8" onClick={onClose}>
            <Icon name="Cross" size={24} fill="#FFF" />
          </button>
          <Loader className="w-5 h-5" />
        </div>
      )}
    </Sidebar>
  );
};

export default CheckinInfoSidebar;
