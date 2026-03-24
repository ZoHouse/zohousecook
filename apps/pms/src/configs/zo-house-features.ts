/**
 * Zo House Feature Gating
 *
 * Features listed here are only visible to Zo House properties during testing.
 * When a feature graduates (status: 'graduated'), it becomes available to all properties.
 *
 * Migration path:
 * 1. Build feature with Supabase backend → test at zozozo.work
 * 2. Backend team creates Django models + endpoints matching Supabase schema
 * 3. Swap hook internals from Supabase → Django (useQueryApi/useMutationApi)
 * 4. Set status: 'graduated', backend: 'django' → feature available on zo.xyz/pm
 */

import { IconName } from "@zo/assets/icons";

export const ZO_HOUSE_OPERATOR_CODES = ["BNGHO812", "BNGS531"];

export type FeatureBackend = "supabase" | "django";
export type FeatureStatus = "testing" | "graduated" | "disabled";

export interface ZoFeatureNavLink {
  id: string;
  name: string;
  path: string;
  icon: IconName;
}

export interface ZoFeature {
  id: string;
  label: string;
  backend: FeatureBackend;
  status: FeatureStatus;
  minAccess: "activity-manager" | "front-desk-manager" | "property-manager" | "owner_partner" | "admin";
  icon: IconName;
  navLinks: ZoFeatureNavLink[];
}

export const ZO_FEATURES: Record<string, ZoFeature> = {
  cafe: {
    id: "cafe",
    label: "Cafe Zomad",
    backend: "supabase",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "Food",
    navLinks: [
      { id: "cafe-dashboard", name: "Dashboard", path: "/cafe", icon: "Food" },
      { id: "cafe-kitchen", name: "Kitchen", path: "/cafe/kitchen", icon: "Food" },
      { id: "cafe-menu", name: "Menu", path: "/cafe/menu", icon: "Menu" },
      { id: "cafe-orders", name: "Orders", path: "/cafe/orders", icon: "Slip" },
      { id: "cafe-tables", name: "Tables", path: "/cafe/tables", icon: "Table" },
      { id: "cafe-meal-plan", name: "Meal Plan", path: "/cafe/meal-plan", icon: "Calendar" },
      { id: "cafe-inventory", name: "Inventory", path: "/cafe/inventory", icon: "NoteBook" },
    ],
  },
  housekeeping: {
    id: "housekeeping",
    label: "Housekeeping",
    backend: "supabase",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "House",
    navLinks: [
      { id: "housekeeping-status", name: "Status", path: "/housekeeping", icon: "House" },
    ],
  },
};

/**
 * Check if a feature should be visible for the given operator code.
 * - 'testing' → only Zo House operator codes
 * - 'graduated' → all operators
 * - 'disabled' → hidden
 */
export function isFeatureVisible(
  feature: ZoFeature,
  operatorCode: string | undefined
): boolean {
  if (feature.status === "disabled") return false;
  if (feature.status === "graduated") return true;
  if (!operatorCode) return false;
  return ZO_HOUSE_OPERATOR_CODES.includes(operatorCode);
}
