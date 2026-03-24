import React from "react";
import { useAssociation } from "../../../hooks";
import NoAccess from "../../ui/NoAccess";

type Role =
  | "activity-manager"
  | "front-desk-manager"
  | "property-manager"
  | "owner_partner"
  | "admin";

interface RequireAccessProps {
  minRole: Role;
  children: React.ReactNode;
}

const RequireAccess: React.FC<RequireAccessProps> = ({ minRole, children }) => {
  const { hasAccess, effectiveRole } = useAssociation();

  if (effectiveRole != null && !hasAccess(minRole)) {
    return <NoAccess />;
  }

  return <>{children}</>;
};

export default RequireAccess;
