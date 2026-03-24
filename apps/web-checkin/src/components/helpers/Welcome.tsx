/* eslint-disable @next/next/no-img-element */
import React, { useMemo } from "react";
import { ZostelStayOperatorResponse } from "../../config";
import { Button, ZostelLoader } from "../ui";
import moment from "moment";
import { formatCapitalize } from "@zo/utils/string";
import Image from "next/image";
import { cn } from "@zo/utils/font";
import { useRouter } from "next/router";

/**
 * Props interface for the Welcome component
 */
interface WelcomeProps {
  /** Function to call when the user submits the form */
  onSubmit: () => void;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether there was an error loading the data */
  isError: boolean;
  /** Property details from the API */
  property: ZostelStayOperatorResponse;
  /** Booking reference code */
  bookingCode: string;
  /** Check-in date string */
  checkin: string;
  /** Check-out date string */
  checkout: string;
  /** Current booking status */
  status: string;
  /** Guest details */
  guest: string[];
  /** Whether the check-in is generic */
  isGenericCheckin?: boolean;
}

/**
 * Welcome component displays the initial check-in screen with property and booking details
 *
 * @param props - Component props
 * @returns React component
 */
const Welcome: React.FC<WelcomeProps> = ({
  isLoading,
  isError,
  property,
  onSubmit,
  bookingCode,
  checkin,
  checkout,
  status,
  guest,
  isGenericCheckin = false,
}) => {
  const router = useRouter();
  /**
   * Array of booking details to display
   * Each item contains an icon and content to render
   */
  const getGuestInitialString = (guest: string[]) => {
    // If array is empty or all items are "Fellow Zostelers", return just once
    if (!guest.length || guest.every((name) => name === "Fellow Zostelers")) {
      return "Fellow Zostelers";
    }

    // Filter out duplicate "Fellow Zostelers"
    const uniqueGuests = guest.filter((name) => name !== "Fellow Zostelers");

    if (uniqueGuests.length === 0) {
      return "Fellow Zostelers";
    }

    if (uniqueGuests.length === 1) {
      return uniqueGuests[0];
    }

    if (uniqueGuests.length === 2) {
      return uniqueGuests.join(" & ");
    }

    return uniqueGuests[0] + " & " + String(uniqueGuests.length - 1) + " more";
  };

  const calculateNights = useMemo(() => {
    if (!checkin || !checkout) return 0;
    return moment(checkout).diff(moment(checkin), "days");
  }, [checkin, checkout]);

  const findMyBookingHandler = () => {
    router.push(`/`);
  };

  const details = [
    {
      icon: "🎟️",
      content: (
        <div>
          <p className="body-text text-zostel-light-text-primary">
            Booking ID:
          </p>
          <strong className="body-text-focus text-zostel-light-text-primary">
            #{bookingCode}
          </strong>
        </div>
      ),
    },
    ...(bookingCode !== "anonymous-checkin"
      ? [
          {
            icon: "🗓️",
            content: (
              <div>
                <p className="body-text text-zostel-light-text-primary">
                  Check-in:{" "}
                  <strong className="body-text-focus text-zostel-light-text-primary">
                    {moment(checkin).format("DD MMM'YY")}
                  </strong>{" "}
                  → Checkout:{" "}
                  <strong className="body-text-focus text-zostel-light-text-primary">
                    {moment(checkout).format("DD MMM'YY")}
                  </strong>{" "}
                  ({calculateNights}{" "}
                  {calculateNights === 1 ? "Night" : "Nights"})
                </p>
              </div>
            ),
          },
          {
            icon: "🔄",
            content: (
              <div>
                <p className="body-text text-zostel-light-text-primary">
                  Status:
                </p>
                <strong className="body-text-focus text-zostel-light-text-primary">
                  {formatCapitalize(status)}
                </strong>
              </div>
            ),
          },
        ]
      : []),
    {
      icon: "👥",
      content: (
        <div>
          <p className="body-text text-zostel-light-text-primary">Guests:</p>
          <strong className="body-text-focus text-zostel-light-text-primary">
            {getGuestInitialString(guest)}
          </strong>
        </div>
      ),
    },
  ];

  /**
   * Determines if check-in is allowed based on booking status and dates
   * Check-in is allowed if:
   * 1. Status is "confirmed"
   * 2. Check-in date is in the future
   * 3. There are no errors
   */
  const isCheckinAllowed = useMemo(() => {
    if (bookingCode === "anonymous-checkin") {
      return true;
    }

    if (
      status === "confirmed" &&
      (moment(checkin).isAfter(moment()) ||
        moment(checkin).isSame(moment(), "day")) &&
      !isError
    ) {
      return true;
    }
    return false;
  }, [status, checkin, isError, bookingCode]);

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return <ZostelLoader isLoading={isLoading} />;
  }

  // Show error state if there was a problem loading the data
  if (isError) {
    return (
      <div className="flex flex-col flex-1 p-6">
        <div className="flex flex-col flex-1 items-center justify-center">
          <picture>
            <source
              srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f636_200d_1f32b_fe0f/512.webp"
              type="image/webp"
            />
            <img
              src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f636_200d_1f32b_fe0f/512.gif"
              alt="😶"
              width="80"
              height="80"
            />
          </picture>
          <p className="py-4 font-semibold text-2xl text-center">
            Seems like you&apos;re in the wrong property!
          </p>
        </div>
      </div>
    );
  }

  // Main component render with property details and check-in button
  return (
    <div className="flex flex-col flex-1 py-6">
      {/* Property name header */}
      <h2
        className={cn(
          "mobile-title text-zostel-light-text-primary",
          !isGenericCheckin ? "text-center" : "text-left"
        )}
      >
        {isGenericCheckin
          ? `Are you checking in to ${property.name}?`
          : `Checkin-in to ${property.name}`}
      </h2>

      {/* Property image */}
      <div className="mt-6 h-72">
        <Image
          src={property.images?.[0]?.image}
          alt={property.name}
          className="w-full h-full object-cover rounded-2xl"
          width={320}
          height={320}
          priority
        />
      </div>

      {/* Booking details section */}
      <div className="flex flex-col gap-4 mt-6">
        {details.map((detail, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="text-2xl">{detail.icon}</span>
            {detail.content}
          </div>
        ))}
      </div>

      {/* Action button - conditionally shows different content based on check-in eligibility */}
      {isGenericCheckin ? (
        <div className="flex flex-col gap-4 mt-6">
          {" "}
          <Button
            disabled={!isCheckinAllowed}
            onClick={onSubmit}
            isLoading={isLoading}
          >
            Yes, Finish Web Check-in
          </Button>{" "}
          <Button variant="secondary" onClick={findMyBookingHandler}>
            No, Find my Booking
          </Button>
        </div>
      ) : (
        <Button
          disabled={!isCheckinAllowed}
          onClick={onSubmit}
          isLoading={isLoading}
          className="flex flex-col items-center justify-center mt-6"
        >
          {isCheckinAllowed ? (
            <>
              <span className="big-button">Finish Web Check-in</span>
              <span className="caption text-white">
                Smart explorers check-in early & chill! 😎
              </span>
            </>
          ) : (
            <>🚫 Checkin not allowed</>
          )}
        </Button>
      )}
    </div>
  );
};

export default Welcome;
