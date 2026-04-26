import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — env vars aren't always present at module-eval time in
// Next.js dev (HMR + .env reloads can race). Build on first call.

let client: SupabaseClient | null = null;

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) {
    throw new Error(
      `Supabase env missing: url=${url ? "set" : "EMPTY"} key=${
        key ? "set" : "EMPTY"
      }. Restart 'nx serve social-engine' after editing apps/social-engine/.env.local.`
    );
  }
  return createClient(url, key);
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) client = buildClient();
    return Reflect.get(client, prop);
  },
});

export const TABLE_POSTS = "social_posts";
