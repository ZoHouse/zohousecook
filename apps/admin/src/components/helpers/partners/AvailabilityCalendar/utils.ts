import {
  SelectionsInventory,
  SelectionsInventoryPricing,
} from "apps/admin/src/config";
import { DisplayPricing } from "./TableRows";

export const getPricingForRatePlan = (
  room: SelectionsInventory,
  ratePlanId: string,
  dateStr: string
): DisplayPricing | null => {
  if (!room?.pricing) return null;

  const pricing = room.pricing.find(
    (p: SelectionsInventoryPricing) =>
      p.rate_plan === ratePlanId && p.date === dateStr
  );
  if (!pricing) return null;

  const currency = room.currency;
  if (!currency) return null;
  const divisor = Math.pow(10, currency.decimals || 8);

  return {
    ...pricing,
    displayPrice: (pricing.price / divisor).toFixed(2),
    currencySymbol: currency.symbol,
    currencyCode: currency.code,
  };
};
