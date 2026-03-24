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
}

const Context = createContext<ContextInterface>({
  associatedOperators: [],
  selectedOperator: {},
  setSelectedOperator: () => {},
  hasAccess: () => false,
  effectiveRole: null,
  principals: [],
});

export default Context;
