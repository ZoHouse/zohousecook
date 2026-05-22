import { createClient } from "@supabase/supabase-js";

// Service role key. used server-side only inside getServerSideProps.
// Never expose via NEXT_PUBLIC_*.
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://elvaqxadfewcsohrswsi.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export interface Resident {
  name: string;
  property: "BLRxZo" | "WTFxZo";
  arrivalDate: string;
  departureDate: string;
}

export interface VillageData {
  blr: Resident[];
  wtf: Resident[];
  syncedAt: string | null;
}

const PROPERTY_CAPS = { BLRxZo: 15, WTFxZo: 20 } as const;

function cleanName(raw: string): string {
  return (raw || "")
    .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export async function fetchResidents(): Promise<VillageData> {
  if (!SUPABASE_KEY) {
    return { blr: [], wtf: [], syncedAt: null };
  }
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("pms_bookings")
    .select("property_id,gname,guestname,arrivaldate,departuredate,cancellationno,noshowuser,updated_at")
    .in("property_id", ["BLRxZo", "WTFxZo"])
    .lte("arrivaldate", now)
    .gt("departuredate", now)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return { blr: [], wtf: [], syncedAt: null };
  }

  const active = data.filter((r: any) => !r.cancellationno && !r.noshowuser);
  const syncedAt = data[0]?.updated_at ?? null;

  const blr: Resident[] = [];
  const wtf: Resident[] = [];
  for (const r of active) {
    const name = cleanName(r.gname || r.guestname || "");
    if (!name) continue;
    const resident: Resident = {
      name,
      property: r.property_id,
      arrivalDate: r.arrivaldate,
      departureDate: r.departuredate,
    };
    if (r.property_id === "BLRxZo") blr.push(resident);
    else if (r.property_id === "WTFxZo") wtf.push(resident);
  }
  // Cap at property capacity so we don't overflow plots if the PMS has doubles
  return {
    blr: blr.slice(0, PROPERTY_CAPS.BLRxZo),
    wtf: wtf.slice(0, PROPERTY_CAPS.WTFxZo),
    syncedAt,
  };
}
