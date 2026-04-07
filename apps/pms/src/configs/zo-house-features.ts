/**
 * Zo House Feature Gating
 *
 * Features listed here are only visible to Zo House properties during testing.
 * When a feature graduates (status: 'graduated'), it becomes available to all properties.
 *
 * Access model:
 * - `minAccess` — role hierarchy check (PM+ sees all features)
 * - `allowedPrincipals` — staff with these backend principals see this feature
 *   regardless of role hierarchy (e.g., chef sees only Cafe Zomad)
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
  /** Backend principals that grant direct access to this feature (bypasses role hierarchy) */
  allowedPrincipals?: string[];
}

export const ZO_FEATURES: Record<string, ZoFeature> = {
  pnl: {
    id: "pnl",
    label: "P&L",
    backend: "supabase",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "Dollar",
    navLinks: [
      { id: "pnl-dashboard", name: "P&L", path: "/pnl", icon: "Dollar" },
    ],
  },
  cafe: {
    id: "cafe",
    label: "Cafe Zomad",
    backend: "supabase",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "Food",
    allowedPrincipals: ["group:cafe-manager", "group:chef", "group:kitchen-staff"],
    navLinks: [
      { id: "cafe-dashboard", name: "Dashboard", path: "/cafe", icon: "Food" },
      { id: "cafe-kitchen", name: "Kitchen", path: "/cafe/kitchen", icon: "Food" },
      { id: "cafe-menu", name: "Menu", path: "/cafe/menu", icon: "Menu" },
      { id: "cafe-orders", name: "Orders", path: "/cafe/orders", icon: "Slip" },
      { id: "cafe-tables", name: "Tables", path: "/cafe/tables", icon: "Table" },
      { id: "cafe-meal-plan", name: "Meal Plan", path: "/cafe/meal-plan", icon: "Calendar" },
      { id: "cafe-inventory", name: "Inventory", path: "/cafe/inventory", icon: "NoteBook" },
      { id: "cafe-food-credits", name: "$food Credits", path: "/cafe/food-credits", icon: "NoteBook" },
    ],
  },
  housekeeping: {
    id: "housekeeping",
    label: "Housekeeping",
    backend: "django",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "House",
    allowedPrincipals: ["group:housekeeping-manager", "group:housekeeping-staff"],
    navLinks: [
      { id: "housekeeping-status", name: "Status", path: "/housekeeping", icon: "House" },
      { id: "housekeeping-ops", name: "House Ops", path: "/housekeeping/ops", icon: "Doc" },
    ],
  },
  iot: {
    id: "iot",
    label: "IoT",
    backend: "supabase",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "Wifi",
    navLinks: [
      { id: "iot-overview", name: "Command Center", path: "/iot", icon: "Monitor" },
      { id: "iot-cameras", name: "Cameras", path: "/iot/cameras", icon: "Cctv" },
      { id: "iot-locks", name: "Locks", path: "/iot/locks", icon: "DoorLock" },
      { id: "iot-screens", name: "Screens", path: "/iot/screens", icon: "Projector" },
      { id: "iot-lights", name: "Lights", path: "/iot/lights", icon: "Vibe" },
    ],
  },
  residents: {
    id: "residents",
    label: "Residents",
    backend: "supabase",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "People",
    navLinks: [
      { id: "residents-dashboard", name: "Dashboard", path: "/residents", icon: "People" },
      { id: "residents-occupancy", name: "Occupancy", path: "/residents/occupancy", icon: "Calendar" },
      { id: "residents-pipeline", name: "Pipeline", path: "/residents/pipeline", icon: "Slip" },
      { id: "residents-applications", name: "Applications", path: "/residents/applications", icon: "Doc" },
    ],
  },
  zo_distribution: {
    id: "zo_distribution",
    label: "$Zo Distribution",
    backend: "django",
    status: "testing",
    minAccess: "front-desk-manager",
    icon: "Vibe",
    navLinks: [
      { id: "zo-dist-dashboard", name: "Dashboard", path: "/zo-distribution", icon: "Vibe" },
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

/**
 * Check if the user has access to a feature via their principals.
 * Returns true if any of the user's principals match the feature's allowedPrincipals.
 */
export function hasPrincipalAccess(
  feature: ZoFeature,
  userPrincipals: string[]
): boolean {
  if (!feature.allowedPrincipals || feature.allowedPrincipals.length === 0) return false;
  return feature.allowedPrincipals.some((p) => userPrincipals.includes(p));
}
