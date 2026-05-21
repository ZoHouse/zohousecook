import { GeneralObject } from "@zo/definitions/general";
import { createContext } from "react";

interface ContextInterface {
  associatedOperators: GeneralObject[];
  selectedOperator: GeneralObject;
  setSelectedOperator: (operator: GeneralObject) => void;
  hasAccess: (
    minRole:
      | "activity-manager"
      | "front-desk-manager"
      | "property-manager"
      | "owner_partner"
      | "admin"
  ) => boolean;
  effectiveRole:
    | null
    | "none"
    | "activity-manager"
    | "front-desk-manager"
    | "property-manager"
    | "owner_partner"
    | "admin";
  principals: string[];
  /**
   * Raw counts from the auth-resolution pipeline — surfaced so an
   * on-screen diagnostic can show WHERE operator resolution broke for a
   * staff member (without needing browser dev-tools / a network tab).
   */
  diagnostics: {
    /** scope permissions returned by AUTHORIZATION_SCOPE_ME */
    permissionsCount: number;
    /** operator-model associations from AUTHORIZATION_MY_ASSOCIATION */
    operatorAssociationsCount: number;
    /** operators CRS_OPERATORS resolved (before any permission filtering) */
    rawOperatorsCount: number;
  };
}

const Context = createContext<ContextInterface>({
  associatedOperators: [],
  selectedOperator: {},
  setSelectedOperator: () => {},
  hasAccess: () => false,
  effectiveRole: null,
  principals: [],
  diagnostics: {
    permissionsCount: 0,
    operatorAssociationsCount: 0,
    rawOperatorsCount: 0,
  },
});

export default Context;
