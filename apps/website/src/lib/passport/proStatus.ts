import type { PassportSubscription } from "../../hooks/usePassportSubscription";

export interface StatusPill {
  label: string;
  className: string;
}

export function isFounderProfile(profile: unknown): boolean {
  const raw = (profile || {}) as Record<string, unknown>;
  const membership = raw.membership;
  const founderCount = raw.founder_nfts_count;

  return (
    (typeof membership === "string" &&
      membership.toLowerCase().trim() === "founder") ||
    raw.role === "Founder" ||
    (typeof founderCount === "number" && founderCount > 0)
  );
}

export function formatAmount(
  amount: number | null | undefined,
  symbol: string | null | undefined,
  decimals: number | null | undefined,
): string {
  const safeAmount = typeof amount === "number" ? amount : 49900000000;
  const safeDecimals = typeof decimals === "number" ? decimals : 8;
  const safeSymbol = symbol || "₹";
  return `${safeSymbol}${(safeAmount / Math.pow(10, safeDecimals)).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: safeDecimals,
    },
  )}`;
}

export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function describeBilling(subscription: PassportSubscription | null): string {
  if (!subscription) {
    return "No paid Passport Pro membership yet.";
  }

  if (subscription.status === "pending") {
    return "Waiting for the first Razorpay payment confirmation.";
  }

  if (subscription.is_active) {
    if (subscription.cancelled_at) {
      const cancelledAt = formatDate(subscription.cancelled_at);
      return cancelledAt
        ? `Cancellation requested on ${cancelledAt}. Access stays live until the cycle ends.`
        : "Cancellation requested. Access stays live until the cycle ends.";
    }

    const renewsAt = formatDate(subscription.renews_at);
    return renewsAt
      ? `Active now. Next renewal is ${renewsAt}.`
      : "Active now.";
  }

  if (subscription.status === "paused") {
    return "Billing is paused. Resume or subscribe again to restore Pro billing.";
  }

  if (subscription.status === "halted") {
    return "Razorpay halted the subscription after repeated payment failures.";
  }

  if (subscription.status === "cancelled") {
    return "This paid membership has been cancelled.";
  }

  if (subscription.status === "expired") {
    return "This paid membership has expired.";
  }

  return "No active paid Passport Pro membership.";
}

export function describeAccess(
  subscription: PassportSubscription | null,
  founder: boolean,
): string {
  if (founder) {
    return "Founder membership is currently unlocking Pro access for this account.";
  }

  if (subscription?.is_active) {
    return "Passport Pro is active on this account.";
  }

  if (subscription?.status === "pending") {
    return "Your Pro upgrade has been created. Complete checkout to activate it.";
  }

  return "This account is currently on the free Passport tier.";
}

export function statusPill(
  subscription: PassportSubscription | null,
  founder: boolean,
): StatusPill {
  if (founder) {
    return {
      label: "Founder Membership",
      className:
        "bg-amber-300/90 text-black border border-amber-200/80 shadow-[0_0_28px_rgba(245,158,11,0.22)]",
    };
  }

  if (subscription?.is_active) {
    return {
      label: "Pro Active",
      className:
        "bg-emerald-300/90 text-black border border-emerald-200/80 shadow-[0_0_28px_rgba(16,185,129,0.22)]",
    };
  }

  if (subscription?.status === "pending") {
    return {
      label: "Payment Pending",
      className:
        "bg-amber-200/90 text-black border border-amber-100/80 shadow-[0_0_28px_rgba(245,158,11,0.16)]",
    };
  }

  if (subscription?.status === "paused" || subscription?.status === "halted") {
    return {
      label: "Needs Attention",
      className:
        "bg-orange-200/90 text-black border border-orange-100/80 shadow-[0_0_28px_rgba(249,115,22,0.18)]",
    };
  }

  if (subscription?.status === "cancelled" || subscription?.status === "expired") {
    return {
      label: "Inactive",
      className:
        "bg-white/10 text-white border border-white/15 shadow-[0_0_28px_rgba(255,255,255,0.08)]",
    };
  }

  return {
    label: "Free",
    className:
      "bg-white/10 text-white border border-white/15 shadow-[0_0_28px_rgba(255,255,255,0.08)]",
  };
}
