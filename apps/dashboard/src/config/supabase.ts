/**
 * Server-side Supabase client for Instagram connect.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix) so this is
 * only available in API routes — never bundled into client-side JS.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const supabase = createClient(supabaseUrl, supabaseKey);
