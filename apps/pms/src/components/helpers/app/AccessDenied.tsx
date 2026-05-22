import { useAuth } from "@zo/auth";
import { Button, Collapse } from "antd";
import { useAssociation } from "../../../hooks";

const AccessDenied = () => {
  const { logout } = useAuth();
  const {
    associatedOperators,
    selectedOperator,
    effectiveRole,
    principals,
    diagnostics: pipelineDiagnostics,
  } = useAssociation();

  const diagnostics = {
    effectiveRole,
    principals,
    selectedOperator: {
      id: selectedOperator?.id ?? null,
      code: selectedOperator?.code ?? null,
      name: selectedOperator?.name ?? null,
    },
    associatedOperatorsCount: associatedOperators?.length ?? 0,
    permissionsCount: pipelineDiagnostics.permissionsCount,
    operatorAssociationsCount: pipelineDiagnostics.operatorAssociationsCount,
    rawOperatorsCount: pipelineDiagnostics.rawOperatorsCount,
  };

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 overflow-x-hidden">
        <div className="flex flex-col items-center w-full h-full py-24 border border-zui-light gap-2">
          <span className="text-xl font-semibold mt-4">Access Denied</span>
          <span className="text-zui-silver">
            You don&apos;t have access to this app. Try logging again.
          </span>
          <Button className="mt-4" type="primary" onClick={logout}>
            Logout
          </Button>
          <Collapse
            ghost
            className="mt-6 max-w-md w-full"
            items={[
              {
                key: "diag",
                label: (
                  <span className="text-xs text-zui-silver">
                    Show debug details
                  </span>
                ),
                children: (
                  <pre
                    className="text-xs bg-zui-bg/40 p-3 rounded border border-zui-light overflow-x-auto"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {JSON.stringify(diagnostics, null, 2)}
                  </pre>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
