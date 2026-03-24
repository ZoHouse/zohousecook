/**
 * Supabase client for Zo House features (cafe, housekeeping, etc.)
 *
 * This is the staging backend. When features graduate to production,
 * their hooks switch from this client to useQueryApi/useMutationApi (Django).
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
