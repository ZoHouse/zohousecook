import { useQueryApi, useZostelAuth } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import React, { useEffect, useMemo, useState } from "react";
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

    // If no Zo permissions but user has Zostel associations, show their operators
    // (staff added via PMS have Zostel associations but may lack Zo backend permissions)
    if (!permissions || permissions.length === 0) {
      return operators;
    }

    const hasWildcard = permissions.some((p: GeneralObject) => p.scope === "*");

    if (hasWildcard) {
      return operators;
    }

    const scopeMatched = operators.filter((op: GeneralObject) => {
      const code = op?.code;
      if (!code) return false;
      return permissions.some(
        (p: GeneralObject) =>
          typeof p.scope === "string" && p.scope.includes(code)
      );
    });

    // If the scope filter strips the user down to ZERO operators even though
    // CRS resolved operators for their Zostel associations, don't leave them
    // stranded — fall back to the full resolved list. This is the chef /
    // PMS-added-staff case: they have a Zostel operator association (so CRS
    // returns the operator) but their Zo backend permissions, if any, don't
    // name that operator's code. Without this fallback selectedOperator never
    // gets a `code`, and every Zo House feature (cafe, IoT, ...) stays hidden
    // because isFeatureVisible() requires the operator code.
    return scopeMatched.length > 0 ? scopeMatched : operators;
  }, [allOperatorsResponse, scopeData]);

  const { isFetching: isFetchingAssociations, data: myAssociationsData } =
    useQueryApi<{ data: { associations: GeneralObject[] } }>("AUTHORIZATION_MY_ASSOCIATION", {
      enabled: isLoggedIn === true,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        const associations = data?.data?.associations;
        if (associations && associations.length > 0) {
          setAssociatedOperatorsQuery(
            associations
              .filter(
                (a: GeneralObject) =>
                  String(a.model || "").toLowerCase() === "operator"
              )
              .map((a: GeneralObject) => a.value)
              .join(",")
          );
        }
      },
    });

  // Raw operator-model associations from the auth backend. Source of truth for
  // "does this user have any Zostel operator association at all" — independent
  // of whether CRS has resolved the operator's full data yet.
  const operatorAssociations = useMemo<GeneralObject[]>(() => {
    const associations = myAssociationsData?.data?.associations || [];
    return associations.filter(
      (a: GeneralObject) =>
        String(a.model || "").toLowerCase() === "operator"
    );
  }, [myAssociationsData]);

  const selectedOperatorAccess = useMemo(() => {
    const permissions = scopeData?.data?.permissions || [];
    const operatorAccess =
      permissions
        .filter(
          (p: GeneralObject) =>
            p.scope?.includes(selectedOperator.code) || p.scope === "*"
        )
        .map((p: GeneralObject) => p.principal) || [];
    const hasCASAdminAccess =
      permissions.find(
        (p: GeneralObject) => p.principal === "group:cas-admin"
      ) || false;

    if (hasCASAdminAccess) {
      operatorAccess.push("group:cas-admin");
    }

    // Staff added via PMS (e.g., chef, kitchen-staff) have a Zostel operator
    // association but no Zo backend scope permission. Grant a front-desk-manager
    // fallback so they can enter the app. We gate on the RAW operator
    // associations (not the CRS-resolved operators) so the fallback fires
    // even when CRS returns empty for the association's value.
    if (
      operatorAccess.length === 0 &&
      operatorAssociations.length > 0 &&
      isValidObject(selectedOperator)
    ) {
      operatorAccess.push("group:front-desk-manager");
    }

    return operatorAccess;
  }, [scopeData, selectedOperator, operatorAssociations]);

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
    // Prefer the CRS-resolved operator (has full data: id, name, code, etc.).
    if (associatedOperators.length > 0 && !isValidObject(selectedOperator)) {
      setSelectedOperator(associatedOperators[0]);
      return;
    }
    // Fallback: if CRS hasn't resolved (slow, empty, or filtered) but we know
    // from the auth backend that the user has an operator association, seed
    // a minimal stub so isValidObject(selectedOperator) is true and the
    // front-desk-manager fallback can fire. The next effect tick replaces
    // this stub with the full operator once CRS resolves.
    if (
      associatedOperators.length === 0 &&
      operatorAssociations.length > 0 &&
      !isValidObject(selectedOperator)
    ) {
      setSelectedOperator({ id: operatorAssociations[0].value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associatedOperators, operatorAssociations]);

  // When CRS finally resolves and we have a stub selectedOperator (missing
  // code/name), upgrade it to the full operator object.
  useEffect(() => {
    if (associatedOperators.length === 0) return;
    if (!isValidObject(selectedOperator)) return;
    if (selectedOperator.code) return; // already fully populated
    const matched = associatedOperators.find(
      (op: GeneralObject) => String(op.id) === String(selectedOperator.id)
    );
    if (matched) {
      setSelectedOperator(matched);
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
