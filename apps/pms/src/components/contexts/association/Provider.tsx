import { useQueryApi, useZostelAuth } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import React, { useEffect, useMemo, useState } from "react";
import { ZO_HOUSE_OPERATOR_CODES } from "../../../configs/zo-house-features";
import Context from "./Context";

interface ProviderProps {
  children: React.ReactNode;
}

const Provider: React.FC<ProviderProps> = ({ children }) => {
  const { isLoggedIn } = useZostelAuth();
  const [selectedOperator, setSelectedOperator] = useState<GeneralObject>({});
  const [associatedOperatorsQuery, setAssociatedOperatorsQuery] =
    useState<string>("");

  const allOperatorsResponse = useQueryApi<{
    data: { results: GeneralObject[] };
  }>(
    "CRS_OPERATORS",
    {
      enabled: associatedOperatorsQuery.length > 0,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    "",
    `ids=${associatedOperatorsQuery}&fields=id,name,code,data,kyc_documents&limit=1000`
  );

  const { data: scopeData, isFetching: isFetchingScope } = useQueryApi(
    "AUTHORIZATION_SCOPE_ME",
    {
      enabled: isLoggedIn === true,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const associatedOperators = useMemo(() => {
    const operators = allOperatorsResponse.data?.data?.results || [];
    const permissions = scopeData?.data?.permissions;

    // If the Zo backend has permissions, use them to filter operators
    if (permissions && permissions.length > 0) {
      const hasWildcard = permissions.some(
        (p: GeneralObject) => p.scope === "*"
      );
      if (hasWildcard) return operators;

      return operators.filter((op: GeneralObject) => {
        const code = op?.code;
        if (!code) return false;
        return permissions.some(
          (p: GeneralObject) =>
            typeof p.scope === "string" && p.scope.includes(code)
        );
      });
    }

    // Fallback: if no permissions from Zo backend but we have operators
    // from the Zostel association, show all associated operators.
    // This handles staff added via PMS who don't exist in the Zo backend.
    if (!isFetchingScope && operators.length > 0) {
      return operators;
    }

    return [];
  }, [allOperatorsResponse, scopeData, isFetchingScope]);

  const { isFetching: isFetchingAssociations } = useQueryApi<{
    operators: string[];
  }>("AUTHORIZATION_MY_ASSOCIATION", {
    enabled: isLoggedIn === true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      const associations = data?.data?.associations;
      if (associations && associations.length > 0) {
        setAssociatedOperatorsQuery(
          associations
            .filter((a: GeneralObject) => a.model === "Operator")
            .map((a: GeneralObject) => a.value)
            .join(",")
        );
      }
    },
  });

  const selectedOperatorAccess = useMemo(() => {
    const permissions = scopeData?.data?.permissions;
    const operatorAccess = permissions
      ? permissions
          .filter(
            (p: GeneralObject) =>
              p.scope?.includes(selectedOperator.code) || p.scope === "*"
          )
          .map((p: GeneralObject) => p.principal)
      : [];
    const hasCASAdminAccess = permissions
      ? permissions.find(
          (p: GeneralObject) => p.principal === "group:cas-admin"
        )
      : false;

    if (hasCASAdminAccess) {
      operatorAccess.push("group:cas-admin");
    }

    // Fallback: staff added via PMS (Zostel backend) may not have permissions
    // in the Zo backend. If they have an association with a Zo House operator,
    // grant front-desk-manager level access so they can use the PMS.
    if (
      operatorAccess.length === 0 &&
      !isFetchingScope &&
      selectedOperator?.code &&
      ZO_HOUSE_OPERATOR_CODES.includes(selectedOperator.code) &&
      associatedOperatorsQuery.length > 0
    ) {
      operatorAccess.push("group:front-desk-manager");
    }

    return operatorAccess;
  }, [scopeData, selectedOperator, isFetchingScope, associatedOperatorsQuery]);

  const effectiveRole = useMemo<
    | "none"
    | "activity-manager"
    | "front-desk-manager"
    | "property-manager"
    | "owner_partner"
    | "admin"
    | null
  >(() => {
    if (
      !isFetchingAssociations &&
      !isFetchingScope &&
      !allOperatorsResponse.isFetching
    ) {
      const access = new Set(selectedOperatorAccess);
      if (access.has("group:cas-admin")) return "admin";
      if (access.has("group:owner")) return "owner_partner";
      if (access.has("group:front-desk-manager")) return "front-desk-manager";
      if (access.has("group:property-manager")) return "property-manager";
      if (access.has("group:activity-manager")) return "activity-manager";
      return "none";
    }
    return null;
  }, [
    allOperatorsResponse.isFetching,
    isFetchingAssociations,
    isFetchingScope,
    selectedOperatorAccess,
  ]);

  const hasAccess = useMemo(
    () =>
      (
        minRole:
          | "activity-manager"
          | "front-desk-manager"
          | "property-manager"
          | "owner_partner"
          | "admin"
      ) => {
        const order: (
          | "activity-manager"
          | "front-desk-manager"
          | "property-manager"
          | "owner_partner"
          | "admin"
        )[] = [
          "activity-manager",
          "front-desk-manager",
          "property-manager",
          "owner_partner",
          "admin",
        ];
        const currentIndex =
          effectiveRole === "none" || effectiveRole === null
            ? -1
            : order.indexOf(effectiveRole);
        const requiredIndex = order.indexOf(minRole);
        return currentIndex >= requiredIndex && currentIndex !== -1;
      },
    [effectiveRole]
  );

  useEffect(() => {
    if (associatedOperators.length > 0 && !isValidObject(selectedOperator)) {
      setSelectedOperator(associatedOperators[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associatedOperators]);

  return (
    <Context.Provider
      value={{
        associatedOperators,
        selectedOperator,
        setSelectedOperator,
        hasAccess,
        effectiveRole,
        principals: selectedOperatorAccess,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Provider;
