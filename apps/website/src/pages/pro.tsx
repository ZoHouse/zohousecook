import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth, useProfile } from "@zo/auth";
import { toast } from "sonner";
import {
  getPassportApiErrorMessage,
  type PassportSubscription,
  usePassportSubscription,
} from "../hooks/usePassportSubscription";
import { rubikClassName, syneClassName } from "../components/utils/font";

const PRO_PLAN_PRICING_ID = (
  process.env.NEXT_PUBLIC_PASSPORT_PRO_PLAN_PRICING_ID ||
  ((process.env.API_BASE_URL_PASSPORT || process.env.API_BASE_URL || "").trim() ===
  "https://api.io.zo.xyz"
    ? "06aa8e5a-ac66-494c-9a0e-c9bb25542757"
    : "")
).trim();
const RAZORPAY_KEY_ID = (
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
).trim();

const BENEFITS = [
  "Daily bed drops and bounties across Zostel inventory.",
  "7% recurring commission on Passport referrals.",
  "Revenue unlocks on participating creator content.",
  "Priority access to quests, badges, and monetization lanes.",
];

interface HeroCopy {
  pill: string;
  pillTone: "amber" | "emerald" | "neutral";
  headline: string;
  body?: string;
}

function heroCopy(
  founder: boolean,
  subscription: PassportSubscription | null,
  firstName: string | null,
): HeroCopy {
  const greeting = firstName ? `${firstName}, ` : "";

  if (founder) {
    return {
      pill: "Founder Member",
      pillTone: "amber",
      headline: firstName
        ? `${firstName}, your Founder Pass already covers Passport Pro.`
        : "Your Founder Pass already covers Passport Pro.",
    };
  }

  if (subscription?.is_active && subscription?.is_paid) {
    return {
      pill: "Pro Member",
      pillTone: "emerald",
      headline: `${greeting}Passport Pro is live on your account.`,
      body: subscription.cancelled_at
        ? "Cancellation is queued — you keep Pro until the cycle ends. Resubscribe any time below."
        : "Daily bed drops, referral commission, and revenue unlocks are all working in your favour. Manage billing on the right.",
    };
  }

  if (subscription?.status === "pending") {
    return {
      pill: "Payment pending",
      pillTone: "amber",
      headline: `${greeting}finish checkout to switch on Pro.`,
      body: "We've created your subscription with Razorpay. Tap Continue checkout to complete the first payment and Pro flips on instantly.",
    };
  }

  return {
    pill: "Become Pro",
    pillTone: "neutral",
    headline: "Earn from your Zo identity.",
    body: "Daily creator bed drops, recurring commission on Passport referrals, and revenue unlocks for participating posts. ₹499/month, cancel any time.",
  };
}

const HERO_PILL_CLASSES: Record<HeroCopy["pillTone"], string> = {
  amber:
    "border-amber-200/15 bg-amber-200/8 text-amber-100/85",
  emerald:
    "border-emerald-200/15 bg-emerald-200/8 text-emerald-100/85",
  neutral: "border-white/12 bg-white/6 text-white/70",
};

function normalizePhone(phone: string | null | undefined): string | undefined {
  const digits = (phone || "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? digits : undefined;
}

function formatAmount(
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

function formatDate(value: string | null | undefined): string | null {
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

function isFounderProfile(profile: unknown): boolean {
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

function describeBilling(subscription: PassportSubscription | null): string {
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

function describeAccess(
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

function statusPill(
  subscription: PassportSubscription | null,
  founder: boolean,
): { label: string; className: string } {
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

// Dev-only `?view=free|pending|pro|founder` lets you preview each hero state
// without juggling test accounts. Disabled in production builds — the override
// only fires when NODE_ENV !== 'production'.
type PreviewView = "free" | "pending" | "pro" | "founder";
const PREVIEW_VIEWS: PreviewView[] = ["free", "pending", "pro", "founder"];

function buildPreviewSubscription(view: PreviewView): PassportSubscription | null {
  const baseAmount = 49900000000; // 499 * 10^8 (matches formatAmount decimals=8)
  const baseCurrency = { symbol: "₹", decimals: 8 };
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (view === "pro")
    return {
      is_active: true,
      is_paid: true,
      status: "active",
      amount: baseAmount,
      currency: baseCurrency,
      ref_id: "preview-active",
      renews_at: inThirtyDays,
      last_charged_at: lastWeek,
    };
  if (view === "pending")
    return {
      is_active: false,
      is_paid: false,
      status: "pending",
      amount: baseAmount,
      currency: baseCurrency,
      ref_id: "preview-pending",
    };
  return null; // free / founder
}

export default function ProPage() {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();
  const { profile } = useProfile();
  const {
    subscription: realSubscription,
    isLoading,
    refresh,
    subscribe,
    unsubscribe,
    isSubscribing,
    isUnsubscribing,
  } = usePassportSubscription();
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const rawProfile = profile as Record<string, unknown> | null;
  const realFounder = isFounderProfile(rawProfile);

  const previewView: PreviewView | null =
    process.env.NODE_ENV !== "production" &&
    typeof router.query.view === "string" &&
    PREVIEW_VIEWS.includes(router.query.view as PreviewView)
      ? (router.query.view as PreviewView)
      : null;

  const founder = previewView ? previewView === "founder" : realFounder;
  const subscription = previewView ? buildPreviewSubscription(previewView) : realSubscription;
  const status = statusPill(subscription, founder);
  const firstName =
    ((rawProfile?.full_name as string | undefined) || "").split(" ")[0] ||
    (rawProfile?.custom_nickname as string | undefined) ||
    (rawProfile?.nickname as string | undefined) ||
    null;
  const hero = heroCopy(founder, subscription, firstName);
  const hasPendingSubscription =
    subscription?.status === "pending" && !!subscription?.ref_id;
  const hasActivePaidSubscription =
    !!subscription?.is_active && !!subscription?.is_paid;
  const hasCancellationQueued =
    hasActivePaidSubscription && !!subscription?.cancelled_at;
  const canCancelRenewal = hasActivePaidSubscription && !hasCancellationQueued;
  const canStartPurchase =
    isLoggedIn === true &&
    !founder &&
    !hasPendingSubscription &&
    !hasActivePaidSubscription &&
    !!PRO_PLAN_PRICING_ID;
  const showPurchaseComingSoon =
    isLoggedIn === true &&
    !founder &&
    !hasPendingSubscription &&
    !hasActivePaidSubscription &&
    !PRO_PLAN_PRICING_ID;

  const priceLabel = formatAmount(
    subscription?.amount,
    subscription?.currency?.symbol,
    subscription?.currency?.decimals,
  );

  const primaryLabel =
    isLoggedIn !== true
      ? "Log in to join Passport Pro"
      : hasPendingSubscription
        ? "Continue Razorpay checkout"
        : canStartPurchase
          ? "Buy Passport Pro"
          : founder
            ? "Founder Pro is active"
            : hasActivePaidSubscription
              ? hasCancellationQueued
                ? "Pro stays active until cycle end"
                : "Passport Pro is active"
              : "Membership opening shortly";

  async function openCheckout(
    targetSubscription: PassportSubscription,
    checkoutKey?: string | null,
  ) {
    if (typeof window === "undefined" || !window.Razorpay) {
      throw new Error("Razorpay checkout failed to load. Refresh and try again.");
    }

    if (!targetSubscription.ref_id) {
      throw new Error("Razorpay subscription reference is missing.");
    }

    const key = checkoutKey || RAZORPAY_KEY_ID;
    if (!key) {
      throw new Error("Razorpay checkout key is not configured yet.");
    }

    setIsOpeningCheckout(true);

    const checkout = new window.Razorpay({
      key,
      subscription_id: targetSubscription.ref_id,
      name: "Zo World",
      description: "Passport Pro",
      image:
        "https://cdn.zo.xyz/gallery/media/images/98b0ac2a-69ea-42a7-bd67-30fe47a58ad4_20260501061938.png",
      // recurring=1 tells Checkout to enumerate methods that support
      // mandates (UPI AutoPay, eMandate cards, eNach netbanking) instead
      // of one-shot payment instruments.
      recurring: 1,
      prefill: {
        name:
          (rawProfile?.full_name as string | undefined) ||
          (rawProfile?.nickname as string | undefined) ||
          (rawProfile?.custom_nickname as string | undefined) ||
          undefined,
        email: (rawProfile?.email_address as string | undefined) || undefined,
        contact: normalizePhone(rawProfile?.mobile_number as string | undefined),
      },
      // Surface UPI AutoPay first (mobile-first audience), then cards on
      // eMandate, then netbanking eNach. Razorpay drops any block whose
      // underlying method isn't enabled on the merchant account, so this
      // is safe to ship before every method is fully turned on at the
      // dashboard. eMandate / eNach are flows on top of card / netbanking,
      // not separate methods — Razorpay activates them automatically for
      // mandate-capable payments.
      config: {
        display: {
          blocks: {
            upi: {
              name: "UPI AutoPay",
              instruments: [{ method: "upi" }],
            },
            cards: {
              name: "Card (eMandate)",
              instruments: [{ method: "card" }],
            },
            netbanking: {
              name: "Netbanking (eNach)",
              instruments: [{ method: "netbanking" }],
            },
          },
          sequence: ["block.upi", "block.cards", "block.netbanking"],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
      theme: { color: "#d4a63a" },
      handler: () => {
        setIsOpeningCheckout(false);
        toast.success(
          "Payment received. Passport Pro activates after Razorpay confirms it.",
        );
        void refresh();
        window.setTimeout(() => {
          void refresh();
        }, 4000);
      },
      modal: {
        ondismiss: () => {
          setIsOpeningCheckout(false);
          void refresh();
        },
      },
    });

    checkout.open();
  }

  const handlePrimary = async () => {
    if (isLoggedIn !== true) {
      showLoginModal(undefined, "/pro");
      return;
    }

    try {
      if (hasPendingSubscription && subscription) {
        await openCheckout(subscription);
        return;
      }

      if (founder) {
        toast.success("Founder membership already unlocks Passport Pro.");
        return;
      }

      if (!PRO_PLAN_PRICING_ID) {
        toast.error(
          "Passport Pro purchase is not configured yet. Publish the live Pro pricing first.",
        );
        return;
      }

      const result = await subscribe(PRO_PLAN_PRICING_ID);
      if (!result.subscription) {
        throw new Error("Passport subscription response was empty.");
      }

      if ((result.subscription.amount || 0) <= 0 || !result.subscription.ref_id) {
        toast.success("Passport Pro activated.");
        void refresh();
        return;
      }

      await openCheckout(result.subscription, result.checkoutKey);
    } catch (error) {
      setIsOpeningCheckout(false);
      toast.error(
        getPassportApiErrorMessage(
          error,
          "Failed to start Passport Pro checkout.",
        ),
      );
      void refresh();
    }
  };

  const handleCancelRenewal = async () => {
    try {
      await unsubscribe();
      toast.success(
        "Cancellation requested. Your Pro access stays live until the current billing cycle ends.",
      );
      void refresh();
    } catch (error) {
      toast.error(
        getPassportApiErrorMessage(error, "Failed to cancel Passport Pro."),
      );
    }
  };

  return (
    <>
      <Head>
        <title>Passport Pro · Zo World</title>
      </Head>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-[#08070a] text-white overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-[8%] h-80 w-80 rounded-full bg-amber-500/12 blur-[120px]" />
          <div className="absolute top-40 right-[10%] h-96 w-96 rounded-full bg-emerald-500/8 blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),linear-gradient(180deg,#0b0a0d_0%,#050505_100%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-14">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/passport"
              className="text-white/60 hover:text-white transition-colors text-sm"
            >
              ← Back to Passport
            </Link>
            <button
              onClick={() => void refresh()}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              Refresh status
            </button>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <section>
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.24em] ${HERO_PILL_CLASSES[hero.pillTone]}`}
              >
                {hero.pill}
              </div>

              <h1
                className={`${syneClassName} mt-5 max-w-3xl text-[28px] font-bold leading-[1.06] sm:mt-6 sm:text-5xl sm:leading-[1.02] lg:text-6xl`}
              >
                {hero.headline}
              </h1>

              {hero.body && (
                <p className={`${rubikClassName} mt-4 max-w-2xl text-[15px] leading-[1.55] text-white/65 sm:mt-5 sm:text-lg sm:leading-7`}>
                  {hero.body}
                </p>
              )}

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {BENEFITS.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-6 text-white/80"
                  >
                    {benefit}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_100%)] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:rounded-[28px] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45 sm:text-sm">
                    Current Access
                  </p>
                  <h2 className={`${syneClassName} mt-2 text-2xl font-bold sm:mt-3 sm:text-3xl`}>
                    {priceLabel}
                    <span className="ml-2 text-sm font-normal text-white/45">
                      / month
                    </span>
                  </h2>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-black/25 p-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                    Access
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/85">
                    {describeAccess(subscription, founder)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                    Billing
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {isLoading ? "Loading current subscription…" : describeBilling(subscription)}
                  </p>
                </div>

                {subscription?.renews_at && (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-white/55">Next renewal</span>
                    <span className="text-sm text-white/90">
                      {formatDate(subscription.renews_at)}
                    </span>
                  </div>
                )}

                {subscription?.last_charged_at && (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-white/55">Last charge</span>
                    <span className="text-sm text-white/90">
                      {formatDate(subscription.last_charged_at)}
                    </span>
                  </div>
                )}
              </div>

              {showPurchaseComingSoon && (
                <div className="mt-5 rounded-2xl border border-orange-200/15 bg-orange-300/8 px-4 py-3 text-sm leading-6 text-orange-50/85">
                  Purchase is wired, but the live Pro pricing id has not been
                  configured yet. Publish the prod plan first, then this button
                  will start checkout immediately.
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => void handlePrimary()}
                  disabled={
                    isSubscribing ||
                    isUnsubscribing ||
                    isOpeningCheckout ||
                    (isLoggedIn === true &&
                      !hasPendingSubscription &&
                      !canStartPurchase &&
                      (founder || hasActivePaidSubscription || !PRO_PLAN_PRICING_ID))
                  }
                  className="rounded-2xl bg-[#f0d58d] px-5 py-4 text-sm font-semibold text-black transition hover:bg-[#f4dfaa] disabled:cursor-not-allowed disabled:bg-[#6f664e] disabled:text-white/70"
                >
                  {isSubscribing || isOpeningCheckout
                    ? "Opening Razorpay…"
                    : isUnsubscribing
                      ? "Updating membership…"
                      : primaryLabel}
                </button>

                {canCancelRenewal && (
                  <button
                    onClick={() => void handleCancelRenewal()}
                    disabled={isSubscribing || isUnsubscribing || isOpeningCheckout}
                    className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40"
                  >
                    Cancel renewal at cycle end
                  </button>
                )}

                {!isLoggedIn && (
                  <p className="text-center text-xs text-white/45">
                    Log in with your Zo account to view billing state and start
                    the Razorpay flow.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
