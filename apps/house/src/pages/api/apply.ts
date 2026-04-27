import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { FirstTouch } from "../../lib/analytics/utm";
import {
  buildLeadNotes,
  deriveReferralSource,
  normalizeLandingPath,
  sanitizeFirstTouch,
} from "../../lib/analytics/apply-attribution";

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
  pagePath?: string | null;
  referrer?: string | null;
  firstTouch?: FirstTouch | null;
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

  const firstTouch = sanitizeFirstTouch(body.firstTouch);
  const landingPath = normalizeLandingPath(body.pagePath);
  const referralSource = deriveReferralSource(body.heardFrom);

  const lead = {
    full_name: body.name!.trim(),
    email: body.email!.trim().toLowerCase(),
    phone: body.phone!.trim(),
    twitter,
    what_building: body.building!.trim(),
    motivation: body.problem!.trim(),
    what_you_bring: body.whyJoin!.trim(),
    referral_source: referralSource,
    landing_path: landingPath,
    referrer: body.referrer?.trim() || null,
    utm_source: firstTouch?.utm_source || null,
    utm_medium: firstTouch?.utm_medium || null,
    utm_campaign: firstTouch?.utm_campaign || null,
    utm_content: firstTouch?.utm_content || null,
    utm_term: firstTouch?.utm_term || null,
    fbc: firstTouch?.fbc || null,
    first_touch_captured_at: firstTouch?.captured_at || null,
    preferred_property: body.preferredProperty,
    stage: "applied",
    lead_type: "membership",
    source: "zo.house",
    lead_tags: body.role ? [body.role] : null,
    notes: buildLeadNotes(noteParts, {
      firstTouch: body.firstTouch,
      pagePath: body.pagePath,
      referrer: body.referrer,
    }),
    member_id: profile?.pid || null,
  };

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // No unique constraint on email — plain insert. Duplicates are triaged
  // in the sales admin UI.
  const { data, error } = await client
    .from("pipeline_leads")
    .insert(lead)
    .select("id")
    .single();

  if (error) {
    console.error("pipeline_leads upsert failed:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, id: data?.id });
}
