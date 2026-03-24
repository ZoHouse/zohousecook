import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidString } from "@zo/utils/string";
import { Button, Divider, message, Modal, Radio } from "antd";
import { Inventory } from "apps/admin/src/config";
import { TripBooking } from "apps/admin/src/config/typings";
import { formatPrice } from "apps/admin/src/utils/formatPrice";
import React, { useState } from "react";
import { BookingSummary } from ".";

interface PaymentSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInventory: Inventory | null;
  selectedDate: string | null;
  totalUnits: number;
  refetch: () => void;
  selectedSku: string | null;
  selectedAddons: string[];
  isExcessTcsApplied: boolean;
  handleClose: () => void;
  BookingPreviewSummary: TripBooking | null;
  bookingData: TripBooking;
  discount: number;
  isModifyBookingPreviewLoading: boolean;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  isOpen,
  onClose,
  selectedInventory,
  selectedDate,
  totalUnits,
  selectedSku,
  refetch,
  selectedAddons,
  isExcessTcsApplied,
  handleClose,
  BookingPreviewSummary,
  bookingData,
  discount,
  isModifyBookingPreviewLoading,
}) => {
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);

  const [refundMethod, setRefundMethod] = useState<"credits" | "regular">(
    "credits"
  );

  /** -------------------------------
   * Queries & Mutations
   -------------------------------- */
  const { data: creditsData, refetch: refetchCredits } = useQueryApi<any>(
    "CAS_CREDITS",
    {
      enabled: isOpen && isValidString(bookingData?.user?.id),
      select: (data) => data.data,
    },
    `${bookingData?.user?.id}/`,
    ""
  );

  const { mutateAsync: addGuestDetails } = useMutationApi(
    "CAS_CUSTOMERS",
    {},
    "",
    "POST"
  );

  const { mutateAsync: addBooking } = useMutationApi("CAS_TRIP_BOOKINGS");

  const { mutate: cancelBooking } = useMutationApi(
    "CAS_TRIP_BOOKINGS",
    {},
    "",
    "PUT"
  );

  const bookTripBooking = async () => {
    try {
      setIsBookingInProgress(true);

      cancelBooking(
        {
          data: {
            reason: "Modified to new trip",
            refund_in_credits: true,
            refund_amount: bookingData?.paid_amount,
          },
          route: `${bookingData.id}/cancel/`,
        },
        {
          onSuccess: async () => {
            // 👇 Wait for fresh credits data
            const updatedCredits = await refetchCredits();

            addBooking(
              {
                data: {
                  date: selectedDate,
                  sku: selectedSku,
                  user_pid: bookingData?.user?.pid,
                  offer_discount: discount,
                  units: totalUnits,
                  addons:
                    selectedAddons.length > 0 ? [selectedAddons.join(",")] : [],
                  tcs_declaration: isExcessTcsApplied,
                  credits_to_spend: Math.min(
                    newBookingAmount,
                    updatedCredits?.data?.balance ??
                      updatedCredits?.data?.balance ??
                      0
                  ),
                },
              },
              {
                onSuccess: (response) => {
                  if (bookingData?.customers?.length) {
                    for (const customer of bookingData.customers) {
                      addGuestDetails(
                        {
                          data: {
                            booking: response?.data?.id,
                            first_name: customer?.first_name,
                            last_name: customer?.last_name,
                            middle_name: customer?.middle_name,
                            email: customer?.email,
                            mobile: customer?.mobile,
                            address: customer?.address,
                            gender: customer?.gender,
                            date_of_birth: customer?.date_of_birth,
                            nationality: customer?.nationality?.id,
                          },
                        },
                        {
                          onSuccess: () => {
                            refetch();
                            message.success(
                              "New booking created successfully!"
                            );
                            handleClose();
                          },
                          onError(error) {
                            message.error(processResponseError(error));
                          },
                        }
                      );
                    }
                  }
                },
                onError(error) {
                  message.error(processResponseError(error));
                },
                onSettled: () => {
                  setIsBookingInProgress(false);
                },
              }
            );
          },
          onError(error) {
            message.error(processResponseError(error));
            setIsBookingInProgress(false);
          },
        }
      );
    } catch (err) {
      setIsBookingInProgress(false);
    }
  };

  const remainingAmount =
    bookingData?.paid_amount - (BookingPreviewSummary?.total_amount || 0) || 0;

  // new booking amount vs available funds check
  const newBookingAmount = BookingPreviewSummary?.total_amount || 0;
  const availableFunds =
    (bookingData?.paid_amount || 0) + (creditsData?.balance || 0);

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
      {remainingAmount > 0 && selectedInventory && (
        <div className="py-4">
          <p className="font-medium mb-2">
            Refund Options for Remaining Amount (
            {formatPrice(remainingAmount, selectedInventory?.currency)})
          </p>
          <Radio.Group
            onChange={(e) => setRefundMethod(e.target.value)}
            value={refundMethod}
            className="flex flex-col gap-2"
          >
            <Radio value="credits">Refund to Zo Credits</Radio>
            <Radio value="regular">Refund to Bank / Card</Radio>
          </Radio.Group>
        </div>
      )}

      {creditsData && selectedInventory && (
        <p className="text-sm text-zui-silver mb-2">
          Available Zo Credits:{" "}
          <span className="font-semibold text-zui-neon">
            {formatPrice(creditsData.balance, selectedInventory?.currency)}
          </span>
        </p>
      )}

      {newBookingAmount > availableFunds && selectedInventory && (
        <div className="mt-4 p-3 border rounded-md bg-red-50 text-zui-red">
          User needs to pay{" "}
          <span className="font-semibold">
            {formatPrice(
              newBookingAmount - availableFunds,
              selectedInventory?.currency
            )}
          </span>{" "}
          extra to complete this booking.
        </div>
      )}

      <Divider className="my-6" />

      <BookingSummary
        selectedInventory={selectedInventory}
        totalUnits={totalUnits}
        BookingPreviewSummary={BookingPreviewSummary}
        bookingData={bookingData}
        discount={discount}
        isModifyBookingPreviewLoading={isModifyBookingPreviewLoading}
      />
    </Modal>
  );
};

export default PaymentSummary;
