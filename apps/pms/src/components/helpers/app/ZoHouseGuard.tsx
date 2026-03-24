/**
 * Route guard for Zo House-only features.
 * Wrap any page that should only be accessible to Zo House properties.
 * Redirects to /overview if the current operator is not a Zo House.
 */

import { useRouter } from "next/router";
import { useEffect } from "react";
import { ZO_HOUSE_OPERATOR_CODES } from "../../../configs";
import { useAssociation } from "../../../hooks";

interface ZoHouseGuardProps {
  children: React.ReactNode;
}

const ZoHouseGuard: React.FC<ZoHouseGuardProps> = ({ children }) => {
  const { selectedOperator } = useAssociation();
  const router = useRouter();

  const isZoHouse =
    selectedOperator?.code &&
    ZO_HOUSE_OPERATOR_CODES.includes(selectedOperator.code);

  useEffect(() => {
    if (selectedOperator?.code && !isZoHouse) {
      router.replace("/overview");
    }
  }, [selectedOperator?.code, isZoHouse, router]);

  if (!selectedOperator?.code || !isZoHouse) {
    return null;
  }

  return <>{children}</>;
};

export default ZoHouseGuard;
