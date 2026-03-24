import { Currency } from "../config";

export const formatPrice = (price: number, currency: Currency) => {
  return (
    price * Math.pow(10, currency.decimals ? -currency.decimals : -8)
  ).toFixed(2);
};

export const formatCurrencyPrice = (
  price: number,
  currency: any,
  maximumFractionDigits?: number
) => {
  const intl = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency?.code ?? "INR",
    maximumFractionDigits: maximumFractionDigits ?? 2,
    minimumFractionDigits: 0,
  });

  return intl.format(price / Math.pow(10, currency?.decimals));
};
