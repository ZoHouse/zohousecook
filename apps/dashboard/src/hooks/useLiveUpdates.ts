import { useMemo } from "react";
import { useQueryApi } from "@zo/auth";

export type UpdateType = "checkin" | "checkout" | "rsvp";

export interface LiveUpdate {
  id: string;
  type: UpdateType;
  timestamp: string;
  nickname: string;
  avatar?: string;
  membership?: string;
  location: string;
  detail: string;
  status?: string;
}

function fixAvatarUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

export function useLiveUpdates() {
  const { data: visitsData, isLoading: visitsLoading } = useQueryApi(
    "CAS_VISITS",
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as any,
    "",
    "limit=20&ordering=-checkin_time"
  );

  const { data: bookingsData, isLoading: bookingsLoading } = useQueryApi(
    "BOOKINGS_EXPERIENCE_BOOKINGS",
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as any,
    "",
    "limit=20&ordering=-created_at"
  );

  const updates = useMemo(() => {
    const items: LiveUpdate[] = [];

    // Parse visits into check-in/check-out updates
    const visits = (visitsData as any)?.data?.results;
    if (Array.isArray(visits)) {
      for (const v of visits) {
        const visitor = v.visitor;
        const nickname = visitor?.nickname || visitor?.first_name || "Someone";
        const rawAvatar = visitor?.avatar?.image || visitor?.pfp_image;
        const avatar = fixAvatarUrl(rawAvatar && rawAvatar.length > 0 ? rawAvatar : undefined);
        const estate = v.estate?.name || "Zo House";

        items.push({
          id: `visit-in-${v.id}`,
          type: "checkin",
          timestamp: v.checkin_time,
          nickname,
          avatar,
          membership: visitor?.membership,
          location: estate,
          detail: v.space ? `at ${v.space.name}` : "",
          status: v.status,
        });

        if (v.status === "checked-out" && v.checkout_time) {
          items.push({
            id: `visit-out-${v.id}`,
            type: "checkout",
            timestamp: v.checkout_time,
            nickname,
            avatar,
            membership: visitor?.membership,
            location: estate,
            detail: "",
            status: "checked-out",
          });
        }
      }
    }

    // Parse experience bookings into RSVP updates
    const bookings = (bookingsData as any)?.data?.results;
    if (Array.isArray(bookings)) {
      for (const b of bookings) {
        const sku = b.booked_skus?.[0]?.sku;
        const eventName = sku?.inventory?.name || "an event";
        const operator = b.operator?.alt_name || sku?.inventory?.operator?.name || "";

        items.push({
          id: `rsvp-${b.pid}`,
          type: "rsvp",
          timestamp: b.start_at,
          nickname: eventName,
          location: operator,
          detail: sku?.name || "",
          status: b.status,
        });
      }
    }

    // Sort all updates by timestamp descending
    items.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return tb - ta;
    });

    return items;
  }, [visitsData, bookingsData]);

  return {
    updates,
    isLoading: visitsLoading || bookingsLoading,
  };
}
