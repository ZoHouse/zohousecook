/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth, useQueryApi, useZostelAuth } from "@zo/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import debounce from "lodash/debounce";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MetaTags } from "../components/common";
import { Login } from "../components/helpers";
import { Button, TextInput, ZostelLoader } from "../components/ui";
import { Booking } from "../config";

type Step = "login" | "booking-id";

const Index: NextPage = () => {
  const router = useRouter();
  const { isLoggedIn: isZoLoggedIn } = useAuth();
  const { isLoggedIn: isZostelLoggedIn } = useZostelAuth();
  const [mobile, setMobile] = useState<string>("");
  const [step, setStep] = useState<Step>("login");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Combined login state from both auth systems
  const isLoggedIn = useMemo(
    () => isZoLoggedIn === true && isZostelLoggedIn === true,
    [isZoLoggedIn, isZostelLoggedIn]
  );

  // Update step based on login state
  useMemo(() => {
    if (isLoggedIn) {
      setStep("booking-id");
    }
  }, [isLoggedIn]);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { data: booking, isLoading: isLoadingBooking } = useQueryApi<Booking>(
    "STAY_MY_BOOKINGS_LIST",
    {
      enabled: isValidString(bookingId) && isLoggedIn,
      select: (data) => {
        return data?.data;
      },
      onError: () => {
        setBookingError(
          "This booking does not exists, or you don't have access to it."
        );
      },
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retryOnMount: false,
      retry: false,
    },
    `${bookingId}/` || ""
  );

  const handleSubmit = () => {
    if (isValidObject(booking)) {
      const channelBooking = booking?.channel_booking ? booking?.channel_booking : booking?.code;
      router.push(`/${booking?.operator?.code}/${channelBooking}/`, undefined, {
        shallow: true,
      });
    }
  };

  const debouncedSetBookingId = useCallback(
    debounce((value: string) => {
      setBookingId(value);
      setBookingError(null);
    }, 500),
    []
  );

  const formatDate = (dateString: string) => {
    try {
      return moment(dateString).format("ddd, DD MMM YYYY");
    } catch (error) {
      return dateString;
    }
  };

  const calculateNights = (checkin: string, checkout: string) => {
    try {
      return moment(checkout).diff(moment(checkin), "days");
    } catch (error) {
      return 0;
    }
  };

  const bookingDetails = useMemo(() => {
    if (!booking) return [];

    const nights = calculateNights(booking.checkin, booking.checkout);

    return [
      { label: "Booking ID", value: booking.code },
      { label: "Property", value: booking.operator?.name },
      {
        label: "Check-in",
        value: formatDate(booking.checkin),
      },
      {
        label: "Check-out",
        value: formatDate(booking.checkout),
      },
      {
        label: "Duration",
        value: `${nights} ${nights === 1 ? "Night" : "Nights"}`,
      },
      { label: "Total Guests", value: booking.total_guests },
    ];
  }, [booking]);

  const renderStep = () => {
    switch (step) {
      case "login":
        return (
          <div className="mt-6 w-full max-w-md">
            <Login mobile={mobile} setMobile={setMobile} />
          </div>
        );
      case "booking-id":
        return (
          <>
            <div className="relative w-full max-w-md mt-6">
              <TextInput
                id="booking_id"
                label="Booking ID"
                value={bookingId || ""}
                onChange={debouncedSetBookingId}
              />
            </div>

            {bookingError && (
              <div className="mt-4 p-3 border border-zostel-common-error rounded-lg text-zostel-common-error text-sm text-center">
                {bookingError ||
                  "This booking does not exists, or you don't have access to it."}
              </div>
            )}

            {isLoadingBooking && (
              <div className="mt-6 p-4  rounded-lg text-sm text-center text-[#111111]/60 animate-pulse">
                Searching for your booking...
              </div>
            )}

            {/* booking details */}
            {booking && !isLoadingBooking && !bookingError && (
              <div className="mt-8 w-full max-w-md">
                <div className="p-6 bg-white border border-zostel-light-stroke-primary rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-[#111111]">
                      Booking Found
                    </h2>
                    <div className="px-3 py-1 bg-zostel-common-success/10 text-zostel-common-success rounded-full text-xs font-medium text-zostel-common-success-text">
                      Ready for check-in
                    </div>
                  </div>

                  <ul className="space-y-4 mb-6">
                    {bookingDetails.map((detail, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <p className="text-sm text-[#111111]/60">
                          {detail.label}
                        </p>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#111111]">
                            {detail.value}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Button className="mt-2" fullWidth onClick={handleSubmit}>
                    Start Check-in
                  </Button>
                </div>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <ZostelLoader isLoading={isLoading} />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <MetaTags
        title="Web Checkin | Zostel"
        description="Welcome to Zostel Web-checkin"
      />
      {step === "booking-id" && (
        <>
          <h1 className="mobile-title text-center">Welcome to Web Checkin</h1>
          <h6 className=" text-[#111111]/60 font-medium">
            Enter your booking ID to continue
          </h6>
        </>
      )}
      {renderStep()}
    </div>
  );
};

export default Index;
