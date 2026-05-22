import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { parseSocialIdentity } from "../../lib/social-handle";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://elvaqxadfewcsohrswsi.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ZO_API_BASE = process.env.API_BASE_URL || "https://api.io.zo.xyz";
const ZO_CLIENT_KEY =
  process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB ||
  process.env.APP_ID ||
  "1482d843137574f36f74";

interface ApplyBody {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  socials?: string;
  building?: string;
  problem?: string;
  whyJoin?: string;
  stage?: string;
  heardFrom?: string;
  role?: string;
  preferredProperty?: string;
}

function extractTwitter(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  const match = cleaned.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})/i);
  if (match) return match[1];
  const handle = cleaned.match(/^@?([A-Za-z0-9_]{1,15})$/);
  if (handle) return handle[1];
  return null;
}

async function fetchZoProfile(token: string): Promise<{
  pid?: string;
  mobile_number?: string;
  mobile_country_code?: string;
} | null> {
  try {
    const res = await fetch(`${ZO_API_BASE}/api/v1/profile/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "client-key": ZO_CLIENT_KEY,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.profile || data?.user || data;
    return {
      pid: p?.pid,
      mobile_number: p?.mobile_number,
      mobile_country_code: p?.mobile_country_code,
    };
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return res
      .status(500)
      .json({ error: "Server not configured (missing SUPABASE_SERVICE_ROLE_KEY)" });
  }

  const body = (req.body || {}) as ApplyBody;

  const required: Array<keyof ApplyBody> = [
    "name",
    "email",
    "phone",
    "city",
    "socials",
    "building",
    "problem",
    "whyJoin",
    "stage",
    "role",
    "preferredProperty",
  ];
  const missing = required.filter((k) => !body[k] || !String(body[k]).trim());
  if (missing.length) {
    return res
      .status(400)
      .json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  // Optional Zo profile for attribution.
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const profile = bearer ? await fetchZoProfile(bearer) : null;

  const twitter = extractTwitter(body.socials);
  const noteParts = [
    body.city ? `City: ${body.city}` : "",
    body.stage ? `Builder stage: ${body.stage}` : "",
    body.role ? `Role: ${body.role}` : "",
    !twitter && body.socials ? `Socials: ${body.socials}` : "",
  ].filter(Boolean);

  const lead = {
    full_name: body.name!.trim(),
    email: body.email!.trim().toLowerCase(),
    phone: body.phone!.trim(),
    twitter,
    what_building: body.building!.trim(),
    motivation: body.problem!.trim(),
    what_you_bring: body.whyJoin!.trim(),
    referral_source: body.heardFrom?.trim() || null,
    preferred_property: body.preferredProperty,
    stage: "applied",
    lead_type: "membership",
    source: "zo.house",
    lead_tags: body.role ? [body.role] : null,
    notes: noteParts.join("\n") || null,
    member_id: profile?.pid || null,
  };

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Resolve a per-applicant share slug ("<platform>/<handle>") used by
  // /p/[platform]/[handle] and the OG card route. Falls back to an
  // unguessable random handle under the "u" namespace if socials don't
  // resolve to a known platform.
  const identity = parseSocialIdentity(body.socials || "");
  const baseSlug = identity
    ? `${identity.platform}/${identity.handle}`
    : `u/${randomHandle()}`;
  const shareSlug = await reserveShareSlug(client, baseSlug);

  // No unique constraint on email. plain insert. Duplicates are triaged
  // in the sales admin UI.
  const { data, error } = await client
    .from("pipeline_leads")
    .insert({ ...lead, share_slug: shareSlug })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("pipeline_leads upsert failed:", error);
    return res.status(500).json({ error: error.message });
  }

  // Position on the zo.house waitlist (1-indexed). Race-safe via created_at
  // ordering; if the count query fails we return null and the client falls
  // back to a deterministic hash so the ticket still renders.
  let waitlistNumber: number | null = null;
  if (data?.created_at) {
    const { count, error: countError } = await client
      .from("pipeline_leads")
      .select("*", { count: "exact", head: true })
      .eq("source", "zo.house")
      .lte("created_at", data.created_at);
    if (!countError && typeof count === "number") {
      waitlistNumber = count;
    }
  }

  return res.status(200).json({
    ok: true,
    id: data?.id,
    waitlist_number: waitlistNumber,
    share_slug: shareSlug,
  });
}

function randomHandle(): string {
  // 8-char base36 random. ~10^12 keyspace, enough to avoid collisions for
  // unparseable-socials applicants without growing the URL.
  return Math.random().toString(36).slice(2, 10).padEnd(8, "x");
}

// Find the first available slug. Tries baseSlug, then baseSlug-2, baseSlug-3...
// until SELECT confirms a row with that share_slug doesn't exist. We do a
// pre-check rather than relying on the UNIQUE constraint alone because
// Supabase doesn't surface the conflict cleanly through a single insert call.
async function reserveShareSlug(
  client: SupabaseClient,
  baseSlug: string
): Promise<string> {
  for (let i = 0; i < 25; i += 1) {
    const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
    const { data, error } = await client
      .from("pipeline_leads")
      .select("id")
      .eq("share_slug", candidate)
      .maybeSingle();
    if (error) {
      // Don't block apply on a slug-lookup failure. fall through to the
      // base slug and let the UNIQUE constraint catch any race.
      return candidate;
    }
    if (!data) return candidate;
  }
  // 25 collisions in a row is implausible. append a random suffix to
  // guarantee uniqueness.
  return `${baseSlug}-${randomHandle().slice(0, 4)}`;
}
