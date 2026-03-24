import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { Button, Divider, message, Modal } from "antd";
import { Inventory, TripGuest } from "apps/admin/src/config";
import { TripBooking } from "apps/admin/src/config/typings";
import { formatPrice } from "apps/admin/src/utils/formatPrice";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { BookingSummary } from ".";
import FormElement from "../../Form/FormElement/FormElement";

interface PaymentSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInventory: Inventory | any;
  selectedDate: string | null;
  totalUnits: number;
  guests: TripGuest[];
  refetch: () => void;
  selectedSku: string | null;
  selectedAddons: string[];
  isExcessTcsApplied: boolean;
  handleClose: () => void;
  BookingPreviewSummary: TripBooking | null;
  discount: number;
  addBookingLoading: boolean;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  isOpen,
  onClose,
  selectedInventory,
  selectedDate,
  totalUnits,
  selectedSku,
  guests,
  refetch,
  selectedAddons,
  isExcessTcsApplied,
  handleClose,
  BookingPreviewSummary,
  discount,
  addBookingLoading,
}) => {
  const queryClient = useQueryClient();
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"regular" | "credits">(
    "regular"
  );

  // Fetch available credits for main guest
  const { data: creditsData } = useQueryApi<any>(
    "CAS_CREDITS",
    {
      enabled: isOpen && isValidString(guests[0]?.user?.id),
      select: (data) => data.data,
    },
    `${guests[0]?.user?.id}/`,
    ""
  );

  const { mutateAsync: createGuest } = useMutationApi(
    "CAS_USERS",
    {},
    "",
    "POST"
  );
  const { mutateAsync: addGuestDetails } = useMutationApi(
    "CAS_CUSTOMERS",
    {},
    "",
    "POST"
  );
  const { mutateAsync: addBooking } = useMutationApi("CAS_TRIP_BOOKINGS");

  const formatDate = (date?: Date) =>
    date ? dayjs(date).format("YYYY-MM-DD") : undefined;

  const handleBookTrip = async (userPid: string) => {
    try {
      const bookingResponse = await new Promise<GeneralObject>(
        (resolve, reject) => {
          addBooking(
            {
              data: {
                date: selectedDate,
                sku: selectedSku,
                user_pid: userPid,
                offer_discount: discount,
                units: totalUnits,
                addons: selectedAddons.length > 0 ? selectedAddons : [],
                tcs_declaration: isExcessTcsApplied,
                credits_to_spend:
                  paymentMethod === "credits" &&
                  creditsData &&
                  BookingPreviewSummary
                    ? Math.min(
                        BookingPreviewSummary.total_amount,
                        creditsData.balance
                      )
                    : 0,
              },
            },
            {
              onError: (error) => reject(error),
              onSuccess: (data) => resolve(data),
            }
          );
        }
      );

      const bookingId = bookingResponse.data.id;

      for (const guest of guests) {
        await new Promise((resolve, reject) => {
          addGuestDetails(
            {
              data: {
                booking: bookingId,
                first_name: guest?.first_name,
                last_name: guest?.last_name,
                middle_name: guest?.middle_name,
                email: guest?.email,
                mobile: guest?.mobile,
                address: guest?.address,
                gender: guest?.gender,
                date_of_birth: formatDate(guest?.date_of_birth),
                nationality: guest?.country,
              },
            },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error),
            }
          );
        });
      }

      // After all guests are processed successfully, invalidate and refetch
      queryClient.invalidateQueries(["cas", "customers"]);
      queryClient.invalidateQueries(["cas", "trip", "bookings"]);
      queryClient.invalidateQueries(["CAS_TRIP_BOOKINGS"]);

      // Explicitly call refetch
      await refetch();
      setIsBookingInProgress(false);
      message.success("Booking completed successfully");
      handleClose();
      onClose();
    } catch (error) {
      setIsBookingInProgress(false);
      message.error(processResponseError(error));
    }
  };

  const bookTripBooking = async () => {
    setIsBookingInProgress(true);
    if (!isValidObject(guests[0]?.user)) {
      const guestData = {
        email_address: guests[0]?.email,
        first_name: guests[0]?.first_name,
        last_name: guests[0]?.last_name,
        middle_name: guests[0]?.middle_name,
      };

      createGuest(
        { data: guestData },
        {
          onSuccess(data: any) {
            const newUserPid = data?.data?.profile?.pid;
            if (newUserPid) {
              message.success("Guest created successfully");
              handleBookTrip(newUserPid);
            } else {
              setIsBookingInProgress(false);
              message.error("Failed to create guest profile");
            }
          },
          onError(error) {
            setIsBookingInProgress(false);
            message.error(processResponseError(error));
          },
        }
      );
      return;
    }

    // If verified user exists, proceed with booking
    handleBookTrip(guests[0]?.pid || "");
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="Payment Summary"
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={bookTripBooking}
          disabled={isBookingInProgress}
        >
          Confirm & Pay
        </Button>,
      ]}
    >
      <div>
        {creditsData && creditsData.balance > 0 && (
          <>
            <div className="flex justify-between items-center mb-2">
              <p>Available Credits</p>
              <p className="font-bold text-zui-neon">
                {formatPrice(creditsData.balance, creditsData.currency)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={paymentMethod === "credits"}
                onChange={(e) =>
                  setPaymentMethod(e.target.checked ? "credits" : "regular")
                }
              />
              <label className="cursor-pointer">Use Zo Credits</label>
            </div>
          </>
        )}
      </div>

      <Divider className="my-6" />

      <BookingSummary
        selectedInventory={selectedInventory}
        selectedSlot={selectedDate}
        totalUnits={totalUnits}
        BookingPreviewSummary={BookingPreviewSummary}
        discount={discount}
        addBookingLoading={addBookingLoading}
      />
    </Modal>
  );
};

export default PaymentSummary;
