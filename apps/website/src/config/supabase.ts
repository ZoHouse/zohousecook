/**
 * Supabase client for Zo House features (Cafe Zomad customer ordering).
 * Used only on cafezomad pages.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Use service key to bypass RLS — cafe tables/menu/orders need public read access.
// TODO: Add proper RLS policies (SELECT for anon on cafe_tables, cafe_menu_*, cafe_orders)
// and switch back to anon key.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
