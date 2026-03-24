import Icon from "@zo/assets/icons";
import { Currency } from "@zo/definitions/admin";
import { Tag } from "antd";
import { SelectionsInventory } from "apps/admin/src/config";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";
import { format } from "date-fns";
import React from "react";
import { DisplayPricing } from "./TableRows";

interface ModalSectionProps {
  children: React.ReactNode;
}

const ModalSection: React.FC<
  ModalSectionProps & { title: string; iconName: string }
> = ({ title, iconName, children }) => (
  <div className="bg-zui-dark p-4 border border-zui-lightest">
    <div className="text-sm font-semibold">{title}</div>
    <div className="flex items-start gap-3 mt-2">
      <Icon name={iconName as any} className="w-5 h-5 text-zui-neon" />
      <div className="flex-1">{children}</div>
    </div>
  </div>
);

interface RoomInfoProps {
  room: SelectionsInventory;
}

export const RoomInfoSection: React.FC<RoomInfoProps> = ({ room }) => (
  <ModalSection title="Room Information" iconName="House">
    <div className="text-sm font-semibold text-zui-neon">{room?.name}</div>
    <div className="text-xs text-zui-silver mt-1">
      <span className="capitalize">{room?.category}</span> •{" "}
      <span>{room?.units} total units</span> •{" "}
      <span>Occupancy: {room?.occupancy}</span>
    </div>
  </ModalSection>
);

interface RatePlanInfoProps {
  room: SelectionsInventory | undefined;
  ratePlanId: string;
}

export const RatePlanInfoSection: React.FC<RatePlanInfoProps> = ({
  room,
  ratePlanId,
}) => {
  const ratePlan = room?.rate_plans?.find((rp) => rp.id === ratePlanId);

  return (
    <ModalSection title="Rate Plan" iconName="Ticket">
      <div className="text-sm font-semibold text-zui-neon">
        {ratePlan?.label_public || "Rate Plan"}
      </div>
      {ratePlan?.label_private && (
        <div className="text-xs text-zui-silver mt-1">
          {ratePlan.label_private}
        </div>
      )}
      {ratePlan?.pid && (
        <div className="text-xs text-zui-silver mt-1">PID: {ratePlan.pid}</div>
      )}
    </ModalSection>
  );
};

interface PricingInfoProps {
  selectedDate: string;
  pricing: DisplayPricing | null;
  currency: Currency | undefined;
}

export const PricingInfoSection: React.FC<PricingInfoProps> = ({
  selectedDate,
  pricing,
  currency,
}) => (
  <ModalSection title="Pricing Information" iconName="Dollar">
    <div className="text-sm font-semibold text-zui-neon">
      Pricing for {format(new Date(selectedDate), "MMM dd, yyyy")}
    </div>
    {pricing && currency && (
      <div className="mt-2 space-y-4 text-xs text-zui-silver">
        <div className="flex justify-between">
          <span>Price:</span>
          <span className="text-zui-yellow font-semibold">
            {formatCurrencyPrice(pricing?.price, currency)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Status:</span>
          <span className="text-zui-white font-medium">
            {" "}
            {pricing.sellable ? (
              <span className="text-zui-green border border-zui-green p-1">
                Available
              </span>
            ) : (
              <span className="text-zui-red border border-zui-red p-1">
                Not Available
              </span>
            )}
          </span>
        </div>
      </div>
    )}
  </ModalSection>
);

interface BookingRulesProps {
  pricing: DisplayPricing | null;
}

export const BookingRulesSection: React.FC<BookingRulesProps> = ({
  pricing,
}) => {
  if (!pricing) return null;

  return (
    <ModalSection title="Booking Rules" iconName="Info">
      <div className="space-y-1 text-xs text-zui-silver">
        <div className="flex justify-between">
          <span>Min Bookable Nights:</span>
          <span className="text-zui-white font-medium">
            {pricing.sellable ? pricing.min_bookable_nights || "N/A" : "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Check-in Status:</span>
          <span className="text-zui-white font-medium">
            {pricing.sellable
              ? pricing.checkin_blocked
                ? "Blocked"
                : "Open"
              : "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Check-out Status:</span>
          <span className="text-zui-white font-medium">
            {pricing.sellable
              ? pricing.checkout_blocked
                ? "Blocked"
                : "Open"
              : "N/A"}
          </span>
        </div>
      </div>
    </ModalSection>
  );
};

interface OccupancyProps {
  pricing: DisplayPricing | null;
}

export const OccupancySection: React.FC<OccupancyProps> = ({ pricing }) => {
  if (!pricing) return null;

  return (
    <ModalSection title="Occupancy" iconName="People">
      <div className="space-y-1 text-xs text-zui-silver">
        <div className="flex justify-between">
          <span>Adults:</span>
          <span className="text-zui-white font-medium">
            {pricing.adult_occupancy || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Children:</span>
          <span className="text-zui-white font-medium">
            {pricing.child_occupancy || 0}
          </span>
        </div>
      </div>
    </ModalSection>
  );
};
