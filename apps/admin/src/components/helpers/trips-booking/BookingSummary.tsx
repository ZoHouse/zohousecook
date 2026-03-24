import { CreditCardOutlined } from "@ant-design/icons";
import { Card } from "antd";
import { Inventory } from "apps/admin/src/config";
import { Currency, TripBooking } from "apps/admin/src/config/typings";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";
import React, { useMemo, useState } from "react";
import { TaxBreakdown } from ".";

interface BookingSummaryProps {
  selectedInventory: Inventory | null;
  selectedSlot: string | null;
  totalUnits: number;
  BookingPreviewSummary: TripBooking | null;
  discount: number;
  addBookingLoading: boolean;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedInventory,
  selectedSlot,
  totalUnits,
  BookingPreviewSummary,
  discount,
  addBookingLoading,
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

  const taxBreakup = useMemo(() => {
    const breakdown: any[] = [];

    const basePackagePricing =
      BookingPreviewSummary?.booked_skus?.[0]?.tax_details;

    if (basePackagePricing) {
      breakdown.push({
        name: "Base Price GST",
        amount: basePackagePricing.tax_amount * Number(totalUnits),
        details: {
          countryTax: basePackagePricing.country_tax * Number(totalUnits),
          countryTaxPercent: basePackagePricing.country_tax_percent,
          stateTax: basePackagePricing.state_tax * Number(totalUnits),
          stateTaxPercent: basePackagePricing.state_tax_percent,
        },
      });
    }

    // Addon tax breakdown
    BookingPreviewSummary?.booked_skus?.[0]?.booked_addons?.forEach(
      (addon: any) => {
        if (addon.tax) {
          breakdown.push({
            name: `${addon?.name} Tax`,
            amount: addon.tax.tax_amount * Number(totalUnits),
            details: {
              countryTax: addon.tax.country_tax * Number(totalUnits),
              countryTaxPercent: addon.tax.country_tax_percent,
              stateTax: addon.tax.state_tax * Number(totalUnits),
              stateTaxPercent: addon.tax.state_tax_percent,
            },
          });
        }
      }
    );

    return breakdown;
  }, [BookingPreviewSummary?.booked_skus, totalUnits]);

  const totalTax =
    ((BookingPreviewSummary?.booked_skus?.[0]?.tax_details?.tax_amount || 0) +
      (BookingPreviewSummary?.booked_skus?.[0]?.booked_addons?.[0]?.tax
        ?.tax_amount || 0)) *
    Number(totalUnits || 0);

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
        loading={addBookingLoading}
        className="mb-4"
      >
        {/* Pricing Breakdown */}
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
            BookingPreviewSummary?.booked_skus?.[0]?.booked_addons?.length >
              0 && (
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
                  (BookingPreviewSummary?.booked_skus?.[0]?.tax_details?.tcs ||
                    0) * Number(totalUnits) || 0,
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
      </Card>
      <TaxBreakdown
        taxBreakdown={taxBreakup}
        totalTax={totalTax}
        currency={selectedInventory?.currency as Currency}
        isOpen={isTaxBreakdownOpen}
        handleClose={() => setIsTaxBreakdownOpen(false)}
      />
    </>
  );
};

export default BookingSummary;
