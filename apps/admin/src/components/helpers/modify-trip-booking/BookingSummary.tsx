import { CreditCardOutlined, SwapOutlined } from "@ant-design/icons";
import { Currency } from "@zo/definitions/admin";
import { Card } from "antd";
import { Inventory, TripBooking } from "apps/admin/src/config/typings";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";
import React, { useMemo, useState } from "react";
import { TaxBreakdown } from ".";

interface BookingSummaryProps {
  selectedInventory: Inventory | null;
  totalUnits: number;
  BookingPreviewSummary: TripBooking | null;
  bookingData: TripBooking;
  discount: number;
  isModifyBookingPreviewLoading: boolean;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedInventory,
  totalUnits,
  BookingPreviewSummary,
  bookingData,
  discount,
  isModifyBookingPreviewLoading,
}) => {
  const [isTaxBreakdownOpen, setIsTaxBreakdownOpen] = useState(false);

  const totalAddonsPrice = useMemo(() => {
    return (
      (BookingPreviewSummary?.booked_skus?.[0]?.booked_addons?.reduce(
        (acc: any, addon: any) => acc + addon.price,
        0
      ) || 0) * Number(totalUnits)
    );
  }, [BookingPreviewSummary, totalUnits]);

  const existingBookingAddonsPrice = useMemo(() => {
    return (
      (bookingData?.booked_skus?.[0]?.booked_addons?.reduce(
        (acc: any, addon: any) => acc + addon.price,
        0
      ) || 0) * bookingData?.booked_skus.length
    );
  }, [bookingData]);

  const calculateBookingTaxBreakdown = (
    bookingDetails: TripBooking | null,
    numberOfUnits: number
  ) => {
    const taxBreakdownItems: any[] = [];
    let totalTaxAmount = 0;

    const tripBasePricing = bookingDetails?.booked_skus?.[0]?.tax_details;

    if (tripBasePricing) {
      const tripBaseTaxAmount =
        tripBasePricing.tax_amount * Number(numberOfUnits);
      totalTaxAmount += tripBaseTaxAmount;

      taxBreakdownItems.push({
        name: "Base Price GST",
        amount: tripBaseTaxAmount,
        details: {
          countryTax: tripBasePricing.country_tax * Number(numberOfUnits),
          countryTaxPercent: tripBasePricing.country_tax_percent,
          stateTax: tripBasePricing.state_tax * Number(numberOfUnits),
          stateTaxPercent: tripBasePricing.state_tax_percent,
        },
      });
    }

    // Calculate addon taxes
    bookingDetails?.booked_skus?.[0]?.booked_addons?.forEach(
      (tripAddon: any) => {
        if (tripAddon.tax) {
          const addonTaxAmount =
            tripAddon.tax.tax_amount * Number(numberOfUnits);
          totalTaxAmount += addonTaxAmount;

          taxBreakdownItems.push({
            name: `${tripAddon?.name} Tax`,
            amount: addonTaxAmount,
            details: {
              countryTax: tripAddon.tax.country_tax * Number(numberOfUnits),
              countryTaxPercent: tripAddon.tax.country_tax_percent,
              stateTax: tripAddon.tax.state_tax * Number(numberOfUnits),
              stateTaxPercent: tripAddon.tax.state_tax_percent,
            },
          });
        }
      }
    );

    return { taxBreakdownItems, totalTaxAmount };
  };

  const modifiedBookingTaxData = useMemo(() => {
    return calculateBookingTaxBreakdown(BookingPreviewSummary, totalUnits);
  }, [BookingPreviewSummary, totalUnits]);

  const existingBookingTaxData = useMemo(() => {
    return calculateBookingTaxBreakdown(
      bookingData,
      bookingData?.booked_skus?.length || 0
    );
  }, [bookingData]);

  const totalTax =
    ((BookingPreviewSummary?.booked_skus?.[0]?.tax_details?.tax_amount || 0) +
      (BookingPreviewSummary?.booked_skus?.[0]?.booked_addons?.[0]?.tax
        ?.tax_amount || 0)) *
    Number(totalUnits || 0);

  const exisitngBookingtotalTax =
    ((bookingData?.booked_skus?.[0]?.tax_details?.tax_amount || 0) +
      (bookingData?.booked_skus?.[0]?.booked_addons?.[0]?.tax?.tax_amount ||
        0)) *
    bookingData?.booked_skus?.length;

  const currency = selectedInventory?.currency;

  return (
    <>
      <Card
        title={
          <div className="flex items-center gap-2">
            <CreditCardOutlined />
            <span>Booking Summary</span>
          </div>
        }
        loading={isModifyBookingPreviewLoading}
        className="mb-4"
      >
        <div className="grid grid-cols-2 gap-6">
          {/* Old Booking */}
          {bookingData && (
            <div>
              <h3 className="font-semibold mb-2">Old Booking</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Trip Total</span>
                  {formatCurrencyPrice(
                    (bookingData?.booked_skus?.[0]?.price || 0) *
                      bookingData?.booked_skus?.length,
                    currency
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span>Discount</span>
                  <span>
                    -
                    {formatCurrencyPrice(
                      (bookingData?.offer_discount || 0) +
                        (bookingData?.coupon_discount || 0),
                      currency
                    )}
                  </span>
                </div>

                {bookingData &&
                  bookingData?.booked_skus?.[0]?.booked_addons?.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Add-ons Total</span>
                      <span>
                        {formatCurrencyPrice(
                          existingBookingAddonsPrice || 0,
                          currency
                        )}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between items-center">
                  <span
                    onClick={() => setIsTaxBreakdownOpen(true)}
                    className="underline"
                  >
                    Taxes
                  </span>
                  <span>
                    {formatCurrencyPrice(exisitngBookingtotalTax, currency)}
                  </span>
                </div>

                {selectedInventory?.is_international && (
                  <div className="flex justify-between items-center">
                    <span>
                      TCS (
                      {bookingData?.booked_skus?.[0]?.tax_details?.tcs_percent}
                      %)
                    </span>
                    <span>
                      {formatCurrencyPrice(
                        (bookingData?.booked_skus?.[0]?.tax_details?.tcs || 0) *
                          bookingData?.booked_skus?.length,
                        currency
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Total Amount</span>
                  <span>
                    {formatCurrencyPrice(
                      bookingData?.total_amount || 0,
                      currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* New Booking */}
          {BookingPreviewSummary && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <SwapOutlined /> New Booking
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Trip Total</span>
                  {formatCurrencyPrice(
                    (BookingPreviewSummary?.booked_skus?.[0]?.price || 0) *
                      Number(totalUnits),
                    currency
                  )}
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Discount</span>
                    <span>
                      -
                      {formatCurrencyPrice(
                        (BookingPreviewSummary?.offer_discount || 0) +
                          (BookingPreviewSummary?.coupon_discount || 0),
                        currency
                      )}
                    </span>
                  </div>
                )}

                {BookingPreviewSummary &&
                  BookingPreviewSummary?.booked_skus?.[0]?.booked_addons
                    ?.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Add-ons Total</span>
                      <span>
                        {formatCurrencyPrice(totalAddonsPrice || 0, currency)}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between items-center">
                  <span
                    onClick={() => setIsTaxBreakdownOpen(true)}
                    className="underline"
                  >
                    Taxes
                  </span>
                  <span>{formatCurrencyPrice(totalTax, currency)}</span>
                </div>

                {selectedInventory?.is_international && (
                  <div className="flex justify-between items-center">
                    <span>
                      TCS (
                      {
                        BookingPreviewSummary?.booked_skus?.[0]?.tax_details
                          ?.tcs_percent
                      }
                      %)
                    </span>
                    <span>
                      {formatCurrencyPrice(
                        (BookingPreviewSummary?.booked_skus?.[0]?.tax_details
                          ?.tcs || 0) * Number(totalUnits) || 0,
                        currency
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Total Amount</span>
                  <span>
                    {formatCurrencyPrice(
                      BookingPreviewSummary?.total_amount || 0,
                      currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Payable Now</span>
                  <span>
                    {formatCurrencyPrice(
                      BookingPreviewSummary?.due_amount || 0,
                      currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <TaxBreakdown
        existingBookingTax={
          bookingData
            ? {
                taxBreakdown: existingBookingTaxData.taxBreakdownItems,
                totalTax: existingBookingTaxData.totalTaxAmount,
              }
            : undefined
        }
        modifiedBookingTax={
          BookingPreviewSummary
            ? {
                taxBreakdown: modifiedBookingTaxData.taxBreakdownItems,
                totalTax: modifiedBookingTaxData.totalTaxAmount,
              }
            : undefined
        }
        currency={selectedInventory?.currency as Currency}
        isOpen={isTaxBreakdownOpen}
        handleClose={() => setIsTaxBreakdownOpen(false)}
      />
    </>
  );
};

export default BookingSummary;
