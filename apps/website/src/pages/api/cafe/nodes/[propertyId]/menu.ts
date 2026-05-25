import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function istTodayString(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function istTodayStartUtcIso(): string {
  return `${istTodayString()}T00:00:00+05:30`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { propertyId } = req.query;
  if (typeof propertyId !== "string" || !UUID_RE.test(propertyId)) {
    return res.status(400).json({ error: "invalid propertyId" });
  }

  const today = istTodayString();
  const todayStart = istTodayStartUtcIso();

  const [catsRes, itemsRes, planRes] = await Promise.all([
    supabase
      .from("cafe_menu_categories")
      .select("id,name,sort_order")
      .eq("property_id", propertyId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("cafe_menu_items")
      .select("id,name,description,price,image_url,diet,calories,protein,carbs,fats,category_id,daily_limit,sort_order")
      .eq("property_id", propertyId)
      .eq("is_available", true)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("cafe_meal_plans")
      .select("meal_type,items:cafe_meal_plan_items(menu_item:cafe_menu_items(name))")
      .eq("date", today),
  ]);

  if (catsRes.error) return res.status(500).json({ error: catsRes.error.message });
  if (itemsRes.error) return res.status(500).json({ error: itemsRes.error.message });
  if (planRes.error) return res.status(500).json({ error: planRes.error.message });

  const items = itemsRes.data ?? [];
  const limitedIds = items.filter((i) => i.daily_limit != null).map((i) => i.id);

  const soldByItem: Record<string, number> = {};
  if (limitedIds.length > 0) {
    const { data: soldRows, error: soldErr } = await supabase
      .from("cafe_order_items")
      .select("menu_item_id,quantity,order:cafe_orders!inner(property_id,kitchen_status,created_at)")
      .in("menu_item_id", limitedIds)
      .eq("item_status", "active")
      .gte("order.created_at", todayStart)
      .eq("order.property_id", propertyId)
      .neq("order.kitchen_status", "cancelled");

    if (soldErr) return res.status(500).json({ error: soldErr.message });

    for (const row of soldRows ?? []) {
      soldByItem[row.menu_item_id] = (soldByItem[row.menu_item_id] ?? 0) + (row.quantity ?? 0);
    }
  }

  const itemsWithSold = items.map((i) => {
    const sold = soldByItem[i.id] ?? 0;
    const remaining = i.daily_limit != null ? Math.max(0, i.daily_limit - sold) : null;
    const sold_out = i.daily_limit != null && sold >= i.daily_limit;
    return { ...i, sold_today: sold, remaining_today: remaining, sold_out };
  });

  const meal_plan = (planRes.data ?? []).map((p) => ({
    meal_type: p.meal_type,
    items: (p.items ?? []).map((mi: any) => mi.menu_item?.name).filter(Boolean),
  }));

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json({
    date: today,
    categories: catsRes.data ?? [],
    items: itemsWithSold,
    meal_plan,
  });
}
