import { useAuth } from "@zo/auth";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { zoPassportServer } from "../../../../libs/auth/src/utils";

export interface PassportPlanSummary {
  key?: string | null;
  name?: string | null;
  description?: string | null;
}

export interface PassportCurrencySummary {
  symbol?: string | null;
  name?: string | null;
  decimals?: number | null;
}

export type PassportSubscriptionStatus =
  | "pending"
  | "active"
  | "paused"
  | "halted"
  | "cancelled"
  | "expired"
  | string;

export interface PassportSubscription {
  id?: string | null;
  status?: PassportSubscriptionStatus;
  plan?: PassportPlanSummary | null;
  currency?: PassportCurrencySummary | null;
  period?: string | null;
  interval?: number | null;
  amount?: number | null;
  activated_at?: string | null;
  valid_until?: string | null;
  last_charged_at?: string | null;
  renews_at?: string | null;
  cancelled_at?: string | null;
  is_active?: boolean | null;
  is_paid?: boolean | null;
  ref_id?: string | null;
  [key: string]: unknown;
}

export interface PassportSubscriptionMutationResult {
  raw: unknown;
  subscription: PassportSubscription | null;
  checkoutKey: string | null;
}

type ErrorLike = {
  message?: string;
  response?: {
    data?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function extractPassportSubscription(
  payload: unknown,
): PassportSubscription | null {
  if (isRecord(payload) && isRecord(payload.subscription)) {
    return payload.subscription as PassportSubscription;
  }

  if (isRecord(payload) && ("status" in payload || "id" in payload)) {
    return payload as PassportSubscription;
  }

  return null;
}

export function extractPassportCheckoutKey(payload: unknown): string | null {
  if (!isRecord(payload)) return null;

  for (const key of ["key_id", "razorpay_key_id", "razorpay_key", "key"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

export function getPassportApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const data = (error as ErrorLike)?.response?.data;
  if (isRecord(data)) {
    if (Array.isArray(data.errors) && typeof data.errors[0] === "string") {
      return data.errors[0];
    }
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  }

  if (typeof (error as ErrorLike)?.message === "string") {
    return (error as ErrorLike).message || fallback;
  }

  return fallback;
}

export function usePassportSubscription() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["passport", "subscription", "current"];

  const statusQuery = useQuery(
    queryKey,
    async () => {
      const res = await zoPassportServer.get("/api/v1/passport/subscription/");
      return res.data;
    },
    {
      enabled: isLoggedIn === true,
      staleTime: 30 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const subscribeMutation = useMutation<
    PassportSubscriptionMutationResult,
    unknown,
    string
  >(
    async (planPricing) => {
      const res = await zoPassportServer.post("/api/v1/passport/subscribe/", {
        plan_pricing: planPricing,
      });
      return {
        raw: res.data,
        subscription: extractPassportSubscription(res.data),
        checkoutKey: extractPassportCheckoutKey(res.data),
      };
    },
    {
      onSuccess: (result) => {
        queryClient.setQueryData(queryKey, result.raw);
      },
    },
  );

  const unsubscribeMutation = useMutation<
    PassportSubscriptionMutationResult,
    unknown,
    void
  >(
    async () => {
      const res = await zoPassportServer.post("/api/v1/passport/unsubscribe/");
      return {
        raw: res.data,
        subscription: extractPassportSubscription(res.data),
        checkoutKey: extractPassportCheckoutKey(res.data),
      };
    },
    {
      onSuccess: (result) => {
        queryClient.setQueryData(queryKey, result.raw);
      },
    },
  );

  return {
    subscription:
      isLoggedIn === true
        ? extractPassportSubscription(statusQuery.data)
        : null,
    raw: statusQuery.data,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    refresh: statusQuery.refetch,
    subscribe: subscribeMutation.mutateAsync,
    unsubscribe: unsubscribeMutation.mutateAsync,
    isSubscribing: subscribeMutation.isLoading,
    isUnsubscribing: unsubscribeMutation.isLoading,
  };
}
