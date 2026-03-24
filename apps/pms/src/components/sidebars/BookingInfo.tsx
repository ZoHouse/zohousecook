import { PDFDownloadLink } from "@react-pdf/renderer";
import * as Sentry from "@sentry/nextjs";
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Button, DataList, DataListDisplay, Sidebar } from "@zo/moal";
import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { getFullName } from "@zo/utils/string";
import {
  Button as AntButton,
  Dropdown,
  Modal,
  Popconfirm,
  Tooltip,
} from "antd";
import { parsePhoneNumber } from "libphonenumber-js";
import moment from "moment";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getGender, getStatus } from "../../utils";
import { GovermentIds } from "../helpers/booking-info";
import { CheckinPDF } from "../ui";

interface BookingRoomInfo {
  ref_id: string;
  inventory_name: string;
  asset_name: string;
}

interface BookingInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoadingBooking: boolean;
  booking: GeneralObject;
  refetchBooking: () => void;
  isRefetchingBooking: boolean;
  showQR: (operatorCode: string, bookingCode?: string) => void;
  showCheckinFetcher: (booking: GeneralObject) => void;
  showManualCheckin?: (booking: GeneralObject, checkin?: GeneralObject) => void;
  showExistingGuests: (booking: GeneralObject) => void;
}

const BookingInfoSidebar: React.FC<BookingInfoSidebarProps> = ({
  isOpen,
  onClose,
  isLoadingBooking,
  showQR,
  booking,
  refetchBooking,
  isRefetchingBooking,
  showManualCheckin,
  showCheckinFetcher,
  showExistingGuests,
}) => {
  const [activeCheckinIndex, setActiveCheckinIndex] = useState<number | null>(
    null
  );
  const { isMobile } = useWindowSize();
  const [note, setNote] = useState<string>("");
  const [isNotesCollapsed, setNotesCollapsed] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [isEzeeCheckinRetrying, setIsEzeeCheckinRetrying] =
    useState<boolean>(false);
  const { mutate: updateBooking, isLoading: isUpdatingBooking } =
    useMutationApi("ADMIN_PM_BOOKINGS", {}, "", "PUT");

  const { mutate: updateCheckin, isLoading: isUpdatingCheckin } =
    useMutationApi("ADMIN_PM_CHECKIN", {}, "", "PUT");

  const selectedCheckin = useMemo(
    () =>
      isOpen && isValidObject(booking) && activeCheckinIndex !== null
        ? booking.checkins[activeCheckinIndex] || {}
        : {},
    [isOpen, booking, activeCheckinIndex]
  );

  const areFieldsEditable = useMemo(
    () => booking?.status === "confirmed" && !selectedCheckin?.approved,
    [booking?.status, selectedCheckin?.approved]
  );

  const { data: userDeviceInfo } = useQueryApi<GeneralObject>(
    "ADMIN_USERS",
    {
      enabled: !isNaN(selectedCheckin?.user),
      retry: false,
      select: (data) => data.data,
    },
    `${selectedCheckin?.user}/device/`
  );

  const { mutate: createNotes, isLoading: isCreateNotes } = useMutationApi(
    "ADMIN_PM_USER_NOTES",
    {},
    "",
    "POST"
  );

  const { mutate: ezeeCheckin } = useMutationApi(
    "ADMIN_PM_CHECKIN",
    {},
    "",
    "POST"
  );

  const { data: userNotes, refetch } = useQueryApi<GeneralObject>(
    "ADMIN_PM_USER_NOTES",
    {
      enabled: !isNaN(selectedCheckin?.user),
      retry: false,
      select: (data) => data.data.results,
    },
    "",
    `&user=${selectedCheckin?.user}&ordering=-created_at`
  );

  // Preserve currently selected checkin across refetches
  const activeCheckinIdRef = useRef<string | number | null>(null);

  // Tracks polling attempts per checkin id for property check-in
  const checkingInPropertyMapRef = useRef<Record<string, number>>({});

  const totalOccupancy = useMemo(
    () =>
      booking?.rooms?.reduce(
        (total: number, room: GeneralObject) =>
          total + room.occupancy * room.units,
        0
      ),
    [booking]
  );

  const guestNames: string[] = useMemo(
    () =>
      booking?.guests?.map(
        (c: GeneralObject) => `${c.first_name} ${c.last_name || ""}`
      ) || [],
    [booking]
  );

  const stayInfo: DataList[] = useMemo(
    () =>
      isValidObject(booking)
        ? [
            {
              id: "booking-info",
              title: "",
              data: [
                {
                  id: "code",
                  content: `Booking Code: ${booking.code}`,
                  icon: "Id",
                },
                {
                  id: "status",
                  content: `Status: ${getStatus(booking.status)}`,
                  icon: "Info",
                },
                {
                  id: "checkin",
                  content: `Check-in: ${moment(booking.start_date).format(
                    "DD MMM"
                  )}`,
                  icon: "Checkin",
                },
                {
                  id: "staying-from",
                  content: `Check-out: ${moment(booking.end_date).format(
                    "DD MMM"
                  )}`,
                  icon: "CheckOut",
                },
                {
                  id: "stay",
                  content: `${booking.rooms
                    .map((r: GeneralObject) =>
                      r.units > 1 || booking.rooms.length > 1
                        ? `${r.name} x ${r.units}`
                        : r.name
                    )
                    .join(", ")}`,
                  icon: "Dorm",
                },
                {
                  id: "source",
                  content: `Source: ${booking.source?.name || "N/A"}`,
                  icon: "Ticket",
                },
                {
                  id: "booked_on",
                  content: `Booked on ${
                    booking?.time_create
                      ? moment(booking.time_create).format("D MMM YYYY, h:mm A")
                      : "N/A"
                  }`,
                  icon: "Clock",
                },
                {
                  id: "ezee",
                  content: `Ezee ID: ${booking.meta_details?.ezee_id || "N/A"}`,
                  icon: "Id",
                  isHidden: !booking.meta_details?.ezee_id,
                },
              ],
            },
          ]
        : [],
    [booking]
  );

  const deviceInfo: DataList[] = useMemo(
    () =>
      isValidObject(userDeviceInfo)
        ? [
            {
              id: "device-info",
              title: "",
              data: [
                {
                  id: "version",
                  content: `App Version: ${userDeviceInfo?.meta?.app_version} build ${userDeviceInfo?.meta?.app_build}`,
                  icon: "Id",
                },
                {
                  id: "device",
                  content: userDeviceInfo?.meta?.device_name,
                  icon: "Phone",
                },
              ],
            },
          ]
        : [],
    [userDeviceInfo]
  );

  const personalInfo: DataList[] = useMemo(
    () =>
      isValidObject(selectedCheckin)
        ? [
            {
              id: "personal-info",
              title: "",
              data: [
                {
                  id: "email",
                  content: selectedCheckin.profile.email,
                  icon: "Email",
                },
                {
                  id: "phone",
                  content: (() => {
                    let phone = selectedCheckin.profile.mobile || "";
                    // Remove all spaces
                    phone = phone.replace(/\s+/g, "");
                    // Add + if not present
                    if (phone && phone[0] !== "+") {
                      phone = "+" + phone;
                    }
                    try {
                      return parsePhoneNumber(phone).formatInternational();
                    } catch (e) {
                      Sentry.captureException(e);
                      return phone;
                    }
                  })(),
                  icon: "Phone",
                },
                {
                  id: "gender",
                  content: `Gender: ${getGender(
                    selectedCheckin.profile.gender
                  )}`,
                  icon: "Username",
                },
                {
                  id: "address",
                  content: `Address: ${selectedCheckin.profile.address}`,
                  icon: "Location",
                },
                {
                  id: "arrival_on",
                  content: (() => {
                    // Parse the arrival date string. Explicitly state format for robustness.
                    const dateMoment = moment(
                      selectedCheckin.arrival_on,
                      "YYYY-MM-DD"
                    );

                    // Default result is the formatted date part.
                    // If dateMoment is invalid (e.g., selectedCheckin.arrival_on is malformed),
                    // .format() will produce "Invalid date".
                    let resultString = `Arrival on ${dateMoment.format(
                      "DD MMM YYYY"
                    )}`;

                    if (selectedCheckin.arrival_time) {
                      // If arrival_time is provided, attempt to combine it with the arrival_on date.
                      // selectedCheckin.arrival_on is expected to be in 'YYYY-MM-DD' format.
                      // selectedCheckin.arrival_time is expected to be in 'HH:mm:ss' format.
                      const fullDateTimeStr = `${selectedCheckin.arrival_on}T${selectedCheckin.arrival_time}`;

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
                  content: `Coming from: ${selectedCheckin.coming_from}`,
                  icon: "Location",
                },
                {
                  id: "next_destination",
                  content: `Going to: ${selectedCheckin.next_destination}`,
                  icon: "Location",
                },
                {
                  id: "departure_time",
                  content: `Departure time: ${
                    selectedCheckin.departure_time
                      ? moment(
                          selectedCheckin.departure_time,
                          "HH:mm:ss"
                        ).format("h:mm A")
                      : ""
                  }`,
                  icon: "Clock",
                  isHidden: !selectedCheckin.departure_time,
                },
              ],
            },
          ]
        : [],
    [selectedCheckin]
  );

  const roomAssignmentInfo: DataList[] = useMemo(() => {
    if (!isValidObject(selectedCheckin) || !Array.isArray(booking?.rooms_info)) {
      return [];
    }
    const mappedRoom = (booking.rooms_info as BookingRoomInfo[]).find(
      (roomInfo) => roomInfo.ref_id === selectedCheckin.ref_id
    );
    const content = mappedRoom ? `${mappedRoom.inventory_name} 	- (${mappedRoom.asset_name})` : "Room & bed not assigned yet";
    return [
      {
        id: "room-assignment",
        title: "",
        data: [
          {
            id: "assigned-room",
            content,
            icon: "Dorm",
          },
        ],
      },
    ];
  }, [booking, selectedCheckin]);

  const handleQRShow = () => {
    showQR(booking.operator.code, booking.code);
  };

  const handleNoMoreCheckins = () => {
    updateBooking(
      {
        data: {
          expected_checkin_count: booking?.checkins?.length,
        },
        route: `/${booking.code}/`,
      },
      {
        onSuccess: refetchBooking,
      }
    );
  };

  const handleAddMoreCheckins = () => {
    updateBooking(
      {
        data: {
          expected_checkin_count: 0,
        },
        route: `/${booking.code}/`,
      },
      {
        onSuccess: refetchBooking,
      }
    );
  };

  const handleRevokeCheckin = () => {
    setShowDeleteModal(true);
  };

  const confirmRevokeCheckin = () => {
    // Remove documents from localStorage and trigger update
    const existingDocs = JSON.parse(localStorage.getItem("documents") || "[]");
    const updatedDocs = existingDocs.filter(
      (doc: GeneralObject) =>
        doc.profile_code !== selectedCheckin?.profile?.code
    );

    localStorage.setItem("documents", JSON.stringify(updatedDocs));

    // Dispatch custom event to update notification
    window.dispatchEvent(
      new CustomEvent("documentsUpdated", {
        detail: updatedDocs,
      })
    );

    updateCheckin(
      {
        data: {
          booking: null,
        },
        route: `${selectedCheckin.id}/remove-booking/`,
      },
      {
        onSuccess: () => {
          refetchBooking();
          setShowDeleteModal(false);
        },
      }
    );
  };

  const cancelRevokeCheckin = () => {
    setShowDeleteModal(false);
  };

  const handleNoteSave = () => {
    createNotes(
      {
        data: {
          operator: booking.operator.id,
          user: selectedCheckin?.user,
          booking: booking.id,
          note: note.trim(),
        },
        route: `/`,
      },
      {
        onSuccess: () => {
          refetchBooking();
          refetch();
          setNote("");
        },
      }
    );
  };

  const handleNoteChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    setNote(e.target.value);
  };

  const toggleNotes = () => {
    setNotesCollapsed(!isNotesCollapsed);
  };

  const approveCheckin = () => {
    updateCheckin(
      {
        data: {
          approved: true,
        },
        route: `${selectedCheckin.id}/`,
      },
      {
        onSuccess: refetchBooking,
      }
    );
  };

  const handleCheckinFetch = () => {
    showCheckinFetcher(booking);
  };

  const handleExistingGuestFetch = () => {
    showExistingGuests(booking);
  };

  const handleAddCheckin = () => {
    showManualCheckin && showManualCheckin(booking);
  };

  const editPersonalInfo = () => {
    showManualCheckin && showManualCheckin(booking, selectedCheckin);
  };

  const confirmPropertyCheckin = (id: string) => {
    setIsEzeeCheckinRetrying(true);
    ezeeCheckin(
      {
        data: {
          checkin_id: id,
        },
        route: `${id}/mark-guest-checkin/`,
      },
      {
        onSuccess: (data) => {
          // Start polling for this specific checkin id
          checkingInPropertyMapRef.current[String(id)] = 1;
          toast.info("Ezee checkin started");
          refetchBooking();
        },
        onError: (error) => {
          toast.error("Ezee checkin failed");
        },
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      if (isMobile) {
        setActiveCheckinIndex(null);
      } else if (activeCheckinIndex === null) {
        setActiveCheckinIndex(0);
      }
      setNotesCollapsed(false);
    } else {
      setActiveCheckinIndex(0);
      checkingInPropertyMapRef.current = {};
      setIsEzeeCheckinRetrying(false);
    }
    // Only react to open/close and device layout; do not reset on booking changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isMobile]);

  // Keep the selected checkin stable by anchoring to ID across booking refetches
  useEffect(() => {
    const id = activeCheckinIdRef.current;
    if (!id || !Array.isArray(booking?.checkins)) return;
    const idx = booking.checkins.findIndex(
      (c: GeneralObject) => String(c.id) === String(id)
    );
    if (idx >= 0 && idx !== activeCheckinIndex) {
      setActiveCheckinIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  // When user changes selection or initial selection is set, store its ID
  useEffect(() => {
    if (
      activeCheckinIndex !== null &&
      Array.isArray(booking?.checkins) &&
      booking.checkins[activeCheckinIndex]
    ) {
      const currentId = booking.checkins[activeCheckinIndex].id;
      if (
        currentId &&
        String(activeCheckinIdRef.current) !== String(currentId)
      ) {
        activeCheckinIdRef.current = String(currentId);
      }
    }
  }, [activeCheckinIndex, booking]);

  useEffect(() => {
    const tracking = checkingInPropertyMapRef.current;
    const trackingIds = Object.keys(tracking);
    if (trackingIds.length === 0) return;

    // Evaluate current booking state for all tracked checkins
    const checkins = booking?.checkins || [];

    let hasPendingForNextAttempt = false;

    trackingIds.forEach((id) => {
      const attempts = tracking[id] || 0;
      const found = checkins.find(
        (c: GeneralObject) => String(c.id) === String(id)
      );

      if (found && (found.status === 1 || found.status === 4)) {
        // Success or failure for this checkin id
        delete tracking[id];
        if (String(selectedCheckin?.id) === String(id)) {
          setIsEzeeCheckinRetrying(false);
        }
        if (found.status === 1) {
          toast.success("Ezee checkin successful");
        } else {
          toast.error("Ezee checkin failed");
        }
        return;
      }

      if (attempts >= 5) {
        // Timed out for this checkin id
        delete tracking[id];
        if (String(selectedCheckin?.id) === String(id)) {
          setIsEzeeCheckinRetrying(false);
        }
        toast.error("Ezee checkin timed out. Please try again.");
        return;
      }

      // Needs another polling attempt
      hasPendingForNextAttempt = true;
    });

    if (hasPendingForNextAttempt) {
      setIsEzeeCheckinRetrying(true);
      setTimeout(() => {
        const current = checkingInPropertyMapRef.current;
        // Increment attempt for all still-tracked ids
        Object.keys(current).forEach((id) => {
          current[id] = (current[id] || 0) + 1;
        });
        refetchBooking();
      }, 2000);
    } else {
      setIsEzeeCheckinRetrying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  const comingText = useMemo(() => {
    if (booking?.status === "cancelled") return "Booking Cancelled";

    const startDate = moment(booking.start_date);
    const today = moment();

    // Prefer check-in status of the selected check-in over booking status
    const scStatus = selectedCheckin?.status;
    if (scStatus === 1) return "has checked in";
    if (scStatus === 3) return "is checking in";
    if (scStatus === 4) return "check-in failed";

    // Fall back to date-based messaging
    if (today.isBefore(startDate, "day")) return "coming soon";
    if (today.isAfter(startDate, "day")) return "is staying here";
    return "is arriving today";
  }, [booking, selectedCheckin]);

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={onClose}
      scrollableChildren={false}
      className="flex flex-col !px-0 overflow-hidden"
    >
      {!isLoadingBooking ? (
        <div className="flex-1 flex w-full items-stretch overflow-hidden divide-x divide-zui-light">
          <div
            className={cn(
              "w-screen md:w-72 flex flex-col divide-y divide-zui-light",
              isMobile && activeCheckinIndex !== null && "hidden"
            )}
          >
            <div className="flex justify-end items-center md:hidden gap-6 mt-1 md:mt-0 p-6 w-full">
              <button onClick={refetchBooking}>
                <Icon name="Refresh" size={20} fill="#FFF" />
              </button>
              <button onClick={onClose}>
                <Icon name="Cross" size={24} fill="#FFF" />
              </button>
            </div>

            <div className="flex flex-col pt-6 md:pt-8">
              <p className="px-6 md:px-4 text-base font-semibold text-zui-silver uppercase pb-4 flex-shrink-0">
                {totalOccupancy > 1 ? `${totalOccupancy} Guests` : "Guest"}
              </p>
              <div className="flex flex-col max-h-[30vh] overflow-y-auto gap-1 px-6 md:px-4 pb-6">
                {guestNames.map((name, index) => (
                  <span key={index} className="flex gap-x-1">
                    <span className="text-zui-silver flex-shrink-0 pr-1">
                      {index + 1}.-
                    </span>
                    <span className="flex-1">
                      {name}
                      {index === 0 && (
                        <span className="text-zui-silver pl-1">(Owner)</span>
                      )}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <p className="px-6 md:px-4 flex items-center pt-6 pb-4 flex-shrink-0 justify-between">
                <p className="text-base font-semibold text-zui-silver uppercase">
                  Checkins
                </p>
              </p>
              <div className="flex flex-col flex-1 overflow-y-auto divide-y divide-zui-light px-6 md:px-4">
                {Array.from(
                  {
                    length: booking?.expected_checkin_count || totalOccupancy,
                  },
                  (_, index) => {
                    const checkin = booking.checkins[index];

                    const checkinName = checkin
                      ? `${checkin.profile.first_name} ${
                          checkin.profile.last_name || ""
                        }`.trim()
                      : "";
                    const isOwner = guestNames[0] === checkinName;

                    return checkin ? (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveCheckinIndex(index);
                          activeCheckinIdRef.current = String(checkin.id);
                        }}
                        className={cn("flex gap-4 py-4 relative")}
                      >
                        {activeCheckinIndex === index && (
                          <div className="absolute top-0 -left-4 -right-4 h-full bg-zui-light" />
                        )}
                        <span className="text-sm relative text-left flex-1 truncate">
                          {checkinName}
                          {isOwner && (
                            <span className="text-zui-silver pl-1">
                              (Owner)
                            </span>
                          )}
                        </span>

                        {checkin?.approved && checkin.status === 1 && (
                          <span className="relative">
                            <Icon name="Check" size={16} fill="#66DF48" />
                          </span>
                        )}
                        {checkin?.status === 4 && (
                          <span className="relative">
                            <Icon name="Cross" size={16} fill="#FF4545" />
                          </span>
                        )}
                        {checkin.status === 3 && (
                          <span className="relative">
                            <Icon name="Clock" size={16} fill="#FFA500" />
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        key={index}
                        onClick={() => setActiveCheckinIndex(index)}
                        className={cn("flex gap-4 py-4 relative")}
                      >
                        {activeCheckinIndex === index && (
                          <div className="absolute top-0 -left-4 -right-4 h-full bg-zui-light" />
                        )}
                        <span className="text-sm relative text-zui-silver">
                          {isMobile ? "Select " : ""}Guest{" "}
                          {totalOccupancy > 1 ? index + 1 : ""}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
              {booking?.checkins?.length > 0 &&
                booking?.expected_checkin_count === 0 &&
                booking?.checkins?.length < totalOccupancy && (
                  <div className="flex flex-shrink-0 items-center justify-center p-6">
                    <Button
                      type="secondary"
                      onClick={handleNoMoreCheckins}
                      isLoading={isUpdatingBooking}
                    >
                      No More Check-ins
                    </Button>
                  </div>
                )}
              {booking?.checkins?.length > 0 &&
                booking?.expected_checkin_count !== 0 &&
                booking?.expected_checkin_count < totalOccupancy &&
                booking?.checkins?.length < totalOccupancy && (
                  <div className="flex flex-shrink-0 items-center justify-center p-6">
                    <Button
                      type="secondary"
                      onClick={handleAddMoreCheckins}
                      isLoading={isUpdatingBooking}
                    >
                      Add more guests
                    </Button>
                  </div>
                )}
            </div>
          </div>
          <div
            className={cn(
              "flex w-screen flex-col flex-1 divide-y divide-zui-light",
              isMobile && activeCheckinIndex === null && "hidden"
            )}
          >
            {activeCheckinIndex !== null && (
              <>
                <div className="p-6 md:pt-8 flex flex-col flex-shrink-0 gap-y-6">
                  <div className="flex items-start gap-6 justify-between">
                    <span className="text-xl md:text-2xl font-medium">
                      {isValidObject(selectedCheckin) ? (
                        `${selectedCheckin?.profile?.first_name} ${
                          selectedCheckin?.profile?.last_name || ""
                        } `
                      ) : (
                        <span className="text-zui-silver">
                          Guest{" "}
                          {totalOccupancy > 1 ? activeCheckinIndex + 1 : ""}{" "}
                        </span>
                      )}
                      {comingText}
                    </span>
                    <div className="flex items-center gap-6 mt-1 md:mt-0">
                      {isValidObject(selectedCheckin) && (
                        <>
                          <PDFDownloadLink
                            document={
                              <CheckinPDF
                                checkin={selectedCheckin}
                                stayInfo={booking}
                                assets={
                                  (selectedCheckin?.approved
                                    ? selectedCheckin?.data?.assets
                                    : selectedCheckin?.profile?.assets) || []
                                }
                              />
                            }
                            fileName={`Checkin_${selectedCheckin?.profile?.full_name.replace(
                              /\s+/g,
                              "_"
                            )}`}
                          >
                            {({ loading }) => (
                              <Tooltip title="Download Guest Details as PDF">
                                <button className="flex items-center justify-center relative">
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
                          <Tooltip title="Delete Web Check-in">
                            <button
                              className="flex items-center justify-center relative"
                              onClick={handleRevokeCheckin}
                            >
                              <Icon name="Delete" size={24} fill="#FFF" />
                              {isUpdatingCheckin && (
                                <span className="flex items-center justify-center absolute inset-0 bg-zui-dark">
                                  <Loader className="w-4 h-4" />
                                </span>
                              )}
                            </button>
                          </Tooltip>
                        </>
                      )}
                      {isRefetchingBooking ? (
                        <Loader className="w-5 h-5" />
                      ) : (
                        <Tooltip title="Refresh Guest Info">
                          <button onClick={refetchBooking}>
                            <Icon name="Refresh" size={20} fill="#FFF" />
                          </button>
                        </Tooltip>
                      )}
                      {isMobile ? (
                        <button
                          onClick={setActiveCheckinIndex.bind(null, null)}
                        >
                          <Icon name="ArrowLeft" size={24} fill="#FFF" />
                        </button>
                      ) : (
                        <Tooltip title="Close">
                          <button onClick={onClose}>
                            <Icon name="Cross" size={24} fill="#FFF" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                    <div className="flex items-center gap-10 order-1 md:order-2">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-lg">Web check-in</span>
                          {selectedCheckin?.checkin_at && (
                            <span className="text-xs text-zui-silver">
                              at{" "}
                              {moment(selectedCheckin?.checkin_at).format(
                                "LLL"
                              )}
                            </span>
                          )}
                        </div>
                        {isValidObject(selectedCheckin) &&
                        selectedCheckin.approved ? (
                          <div className="flex text-sm items-center gap-2 px-2 py-1.5 bg-[#162312] border border-[#274916]">
                            <Icon name="Check" size={16} fill="#66DF48" />
                            <span className="text-zui-green">Done</span>
                          </div>
                        ) : (
                          <div className="flex text-sm  items-center gap-2 px-2 py-1.5 bg-[#2B2111] border border-[#594214]">
                            <Icon name="Clock" size={16} fill="#FFA500" />
                            <span className="text-[#FFA500]">Pending</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-lg">Property check-in</span>
                          {selectedCheckin.status === 1 &&
                            selectedCheckin?.data?.property_checkin_at && (
                              <span className="text-xs text-zui-silver">
                                at{" "}
                                {moment(
                                  selectedCheckin?.data?.property_checkin_at
                                )
                                  .local()
                                  .format("LLL")}
                              </span>
                            )}
                        </div>
                        {selectedCheckin.status === 4 ? (
                          <Tooltip
                            title={
                              Array.isArray(selectedCheckin.data.ezee_error)
                                ? selectedCheckin.data.ezee_error
                                    .map((e: GeneralObject) => e.ErrorMessage)
                                    .join(" ")
                                : "Error in Ezee"
                            }
                          >
                            <div className="flex text-sm items-center gap-2 px-2 py-1.5 bg-zui-red/20 border border-zui-red">
                              <Icon
                                name="Cross"
                                size={16}
                                className="text-zui-red"
                              />
                              <span className="text-zui-red">Failed</span>
                            </div>
                          </Tooltip>
                        ) : selectedCheckin.status === 1 ? (
                          <div className="flex text-sm items-center gap-2 px-2 py-1.5 bg-[#162312] border border-[#274916]">
                            <Icon name="Check" size={16} fill="#66DF48" />
                            <span className="text-zui-green">Done</span>
                          </div>
                        ) : (
                          <div className="flex text-sm items-center gap-2 px-2 py-1.5 bg-[#2B2111] border border-[#594214]">
                            <Icon name="Clock" size={16} fill="#FFA500" />
                            <span className="text-[#FFA500]">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "grid flex-1 overflow-y-auto divide-x divide-y divide-zui-light grid-cols-1 md:grid-cols-2"
                  )}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between -mb-6 pt-6 px-6">
                      <p className="text-base font-semibold text-zui-silver uppercase">
                        Stay Info
                      </p>
                    </div>
                    <DataListDisplay data={stayInfo} className="px-6" />

                    {isValidObject(selectedCheckin) && (
                      <>
                        <div className="flex items-center justify-between border-t border-zui-light -mb-6 pt-6 px-6">
                          <p className="text-base font-semibold text-zui-silver uppercase">
                            Room Assignment
                          </p>
                        </div>
                        <DataListDisplay data={roomAssignmentInfo} className="px-6"/>
                      </>
                    )}

                    <div className="flex flex-col gap-6 p-6 border-t border-zui-light">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-2">
                          <p className="text-base font-semibold text-zui-silver uppercase">
                            Notes
                          </p>
                          {userNotes?.length > 0 && (
                            <span className="text-xs flex h-6 px-2 justify-center font-semibold items-center border border-zui-light">
                              {userNotes?.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {!isNotesCollapsed &&
                            (booking.manager_notes || "") !== note.trim() && (
                              <button
                                onClick={handleNoteSave}
                                disabled={isCreateNotes}
                              >
                                {isCreateNotes ? (
                                  <Loader className="w-4 h-4" />
                                ) : (
                                  <span className="text-zui-neon">Save</span>
                                )}
                              </button>
                            )}
                          <button
                            onClick={toggleNotes}
                            className={
                              !isNotesCollapsed ? "transform rotate-180" : ""
                            }
                          >
                            <Icon name="AngleDown" size={24} fill="#FFF" />
                          </button>
                        </div>
                      </div>
                      {!isNotesCollapsed && (
                        <>
                          <textarea
                            value={note}
                            onChange={handleNoteChange}
                            placeholder="Add notes related to the guests here. These notes will be visible to the all properties and are non-deletable."
                            className="bg-zui-lighter border focus:outline-zui-white focus-within:outline-none border-zui-light p-4 h-32 w-full resize-none placeholder:text-zui-silver"
                          />
                          {userNotes?.length > 0 && (
                            <>
                              <div className="flex items-start">
                                <p className="text-base font-semibold text-zui-silver">
                                  {userNotes?.length || 0} Past Note
                                  {userNotes?.length > 1 && "s"}
                                </p>
                              </div>
                              <div className="flex flex-col items-center gap-y-1 border border-zui-light divide-y divide-zui-light max-h-72 overflow-y-auto">
                                {userNotes?.map((note: GeneralObject) => (
                                  <div key={note.id} className="p-4 w-full">
                                    <p className="text-base text-zui-white">
                                      &ldquo;{note.note}&rdquo;
                                    </p>
                                    <p className="text-sm mt-2 text-zui-white capitalize">
                                      {getFullName(note.created_by)}
                                    </p>
                                    <p className="text-xs mt-2 text-zui-silver">
                                      {booking.operator.name} - {booking.code}
                                    </p>
                                    <p className="text-xs text-zui-silver">
                                      {moment(note.created_at).format(
                                        "DD MMM YYYY hh:mm:ss A"
                                      )}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {deviceInfo.length > 0 && (
                      <>
                        <div className="flex items-center justify-between border-t border-zui-light -mb-6 pt-6 px-6">
                          <p className="text-base font-semibold text-zui-silver uppercase">
                            Device Info
                          </p>
                        </div>
                        <DataListDisplay data={deviceInfo} className="px-6" />
                      </>
                    )}
                  </div>
                  {isValidObject(selectedCheckin) && (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between -mb-6 pt-6 px-6">
                        <p className="text-base font-semibold text-zui-silver uppercase">
                          Personal Info
                        </p>
                        {areFieldsEditable && (
                          <button
                            className="relative z-10"
                            onClick={editPersonalInfo}
                          >
                            <Icon name="Edit" size={24} fill="#FFF" />
                          </button>
                        )}
                      </div>
                      <DataListDisplay data={personalInfo} className="px-6" />

                      <GovermentIds
                        areFieldsEditable={areFieldsEditable}
                        editPersonalInfo={editPersonalInfo}
                        assets={
                          (selectedCheckin?.approved
                            ? selectedCheckin?.data?.assets
                            : selectedCheckin?.profile?.assets) || []
                        }
                      />
                    </div>
                  )}
                </div>
                {!isValidObject(selectedCheckin) &&
                  booking?.status !== "cancelled" && (
                    <div className="sticky bottom-0 p-4 md:p-6 flex-shrink-0 border-t border-zui-light mt-auto w-full">
                      <div className="md:hidden">
                        <div className="flex items-center gap-4">
                          <AntButton
                            type="primary"
                            className="flex-1  hover:!bg-zui-light border border-white py-6 px-6 font-semibold text-base"
                            onClick={handleCheckinFetch}
                          >
                            Fetch Check-in
                          </AntButton>
                          <Dropdown
                            open={showMoreOptions}
                            onOpenChange={setShowMoreOptions}
                            placement="topRight"
                            trigger={["click"]}
                            dropdownRender={() => (
                              <div className="bg-zui-dark border border-zui-light  overflow-hidden p-2 flex flex-col gap-2 min-w-[240px]">
                                <AntButton
                                  type="primary"
                                  className=" hover:!bg-zui-light border border-white py-6 px-6 font-semibold text-base"
                                  onClick={() => {
                                    handleExistingGuestFetch();
                                    setShowMoreOptions(false);
                                  }}
                                  block
                                >
                                  Extend Guest Stay
                                </AntButton>
                                <AntButton
                                  type="primary"
                                  className=" hover:!bg-zui-light border border-white py-6 px-6 font-semibold text-base"
                                  onClick={() => {
                                    handleAddCheckin();
                                    setShowMoreOptions(false);
                                  }}
                                  block
                                >
                                  Add/Search Guests
                                </AntButton>
                                <AntButton
                                  type="primary"
                                  className=" hover:!bg-zui-light border border-white py-6 px-6 font-semibold text-base"
                                  onClick={() => {
                                    handleQRShow();
                                    setShowMoreOptions(false);
                                  }}
                                  block
                                >
                                  Show QR
                                </AntButton>
                              </div>
                            )}
                          >
                            <button
                              className="p-3 border border-zui-light"
                              onClick={() => {
                                setShowMoreOptions(!showMoreOptions);
                              }}
                            >
                              <Icon
                                name={showMoreOptions ? "Cross" : "More"}
                                size={24}
                                fill="#FFF"
                              />
                            </button>
                          </Dropdown>
                        </div>
                      </div>
                      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <AntButton
                          type="default"
                          className="hover:!bg-zui-white hover:!text-zui-dark border bg-white text-zui-dark border-zui-dark py-5 px-6 font-semibold text-base w-full"
                          onClick={handleAddCheckin}
                        >
                          Add/Search Guests
                        </AntButton>
                        <AntButton
                          type="primary"
                          className="hover:!bg-zui-light border border-white py-5 px-6 font-semibold text-base w-full"
                          onClick={handleCheckinFetch}
                        >
                          Fetch Check-in
                        </AntButton>
                        <AntButton
                          type="primary"
                          className="hover:!bg-zui-light border border-white py-5 px-6 font-semibold text-base w-full"
                          onClick={handleExistingGuestFetch}
                        >
                          Extend Guest Stay
                        </AntButton>

                        <AntButton
                          type="primary"
                          className="hover:!bg-zui-light border border-white py-5 px-6 font-semibold text-base w-full"
                          onClick={handleQRShow}
                        >
                          Show QR
                        </AntButton>
                      </div>
                    </div>
                  )}
                {selectedCheckin.approved ? (
                  selectedCheckin.status === 1 ? (
                    <div className="flex items-center justify-end p-4 pr-10 gap-6">
                      <Tooltip title="Undo property checkin by changing status in Ezee">
                        <Popconfirm
                          title="Undo Property Check-in"
                          description="Please change status in Ezee manually and it will reflect here."
                          onConfirm={() => {
                            // Close the popconfirm on okay
                          }}
                          okText="Okay"
                          cancelText="Cancel"
                        >
                          <AntButton type="primary" size="large">
                            Undo Property Checkin
                          </AntButton>
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  ) : selectedCheckin?.status === 0 ? (
                    <div className="flex items-center justify-end p-4 pr-10 gap-6">
                      <Tooltip title="This will change guest status to checked-in in Ezee">
                        <Popconfirm
                          title="Property Check-in"
                          description={
                            <div>
                              <p>
                                Please ensure you have checked ID and all
                                details <br />
                                of guest before marking this as checkin.
                              </p>
                            </div>
                          }
                          onConfirm={() =>
                            confirmPropertyCheckin(selectedCheckin?.id)
                          }
                          okText="Confirm Property Checkin"
                          cancelText="Cancel"
                        >
                          <AntButton
                            type="primary"
                            size="large"
                            loading={isEzeeCheckinRetrying}
                          >
                            Approve Property Check-in
                          </AntButton>
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  ) : selectedCheckin?.status === 4 ? (
                    <div className="flex items-center justify-end p-4 pr-10 gap-6">
                      <Tooltip title="This will change guest status to checked-in in Ezee">
                        <Popconfirm
                          title="Retry Property Check-in"
                          description={
                            <div>
                              <p>
                                Please ensure you have checked ID and all
                                details <br />
                                of guest before marking this as checkin.
                              </p>
                            </div>
                          }
                          onConfirm={() =>
                            confirmPropertyCheckin(selectedCheckin?.id)
                          }
                          okText="Confirm Retry Property Checkin"
                          cancelText="Cancel"
                        >
                          <AntButton
                            type="primary"
                            size="large"
                            loading={isEzeeCheckinRetrying}
                          >
                            Retry Property Check-in
                          </AntButton>
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  ) : (
                    selectedCheckin.status === 3 && (
                      <AntButton type="primary" size="large" disabled loading>
                        Checking in
                      </AntButton>
                    )
                  )
                ) : (
                  isValidObject(selectedCheckin) &&
                  booking?.status !== "cancelled" && (
                    <div className="flex items-center justify-end p-4 pr-10 gap-6">
                      <AntButton
                        className="flex-none"
                        onClick={approveCheckin}
                        loading={isUpdatingCheckin}
                        size="large"
                        type="primary"
                      >
                        Approve Check-in
                      </AntButton>
                    </div>
                  )
                )}
              </>
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

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Web Check-in?"
        open={showDeleteModal}
        onOk={confirmRevokeCheckin}
        onCancel={cancelRevokeCheckin}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          This will delete the web check-in. You can still check the guest in
          manually.
        </p>
      </Modal>
    </Sidebar>
  );
};

export default BookingInfoSidebar;
