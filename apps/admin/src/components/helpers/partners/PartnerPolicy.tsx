import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { PageContent, PageHeader } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { Alert, App, Button, Empty, Spin, Typography } from "antd";
import { Policy as PolicyType } from "apps/admin/src/config";
import { rubikClassName } from "apps/admin/src/utils";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { PolicySidebar } from "../../sidebars";

interface PartnerPolicyProps {
  operatorId: string | undefined;
}

const groupPoliciesByTitle = (
  policies: PolicyType[]
): Record<string, PolicyType[]> =>
  policies.reduce<Record<string, PolicyType[]>>((grouped, policy) => {
    const key = policy.title || "";
    (grouped[key] = grouped[key] || []).push(policy);
    return grouped;
  }, {});

const PartnerPolicy: React.FC<PartnerPolicyProps> = ({ operatorId }) => {
  const queryClient = useQueryClient();

  const { message } = App.useApp();

  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType[]>([]);

  const [isPolicySidebarVisible, showPolicySidebar, hidePolicySidebar] =
    useVisibilityState(false);

  const {
    data: partnerPolicies,
    refetch,
    isLoading,
    error,
  } = useQueryApi<PolicyType[]>(
    "CAS_OPERATORS",
    {
      enabled: isValidString(operatorId),
      select: (data) => data.data,
    },
    `${operatorId}/policies/`,
    "limit=-1"
  );

  const { mutate: updateOperator } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    "PUT"
  );

  const policiesGroupedByTitle = useMemo(
    () => groupPoliciesByTitle(partnerPolicies || []),
    [partnerPolicies]
  );

  const handleSavePolicy = (policies: PolicyType[]) => {
    const allPolicies = policies
      .filter((policy) => isValidString(policy.description))
      .map(({ title, icon, description, id, sort_index }) => ({
        title,
        icon,
        description,
        sort_index,
        id,
      }));

    if (operatorId) {
      updateOperator(
        {
          data: allPolicies,
          route: `${operatorId}/policies/replace-all/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries(["cas", "operators"]);
            refetch();
            message.success("Policies have been updated");
            hidePolicySidebar();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  };

  const handleManagePolicy = (policies: PolicyType[]) => {
    setSelectedPolicy(policies);
    showPolicySidebar();
  };

  if (error) {
    return <Alert message="Error loading policies" type="error" showIcon />;
  }

  return (
    <>
      <PageHeader
        title="Policy"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Manage Policies",
            onClick: () => handleManagePolicy(partnerPolicies || []),
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        <Spin spinning={isLoading}>
          <div className="flex-grow p-2 overflow-y-auto mt-6">
            {Object.keys(policiesGroupedByTitle).length > 0 ? (
              Object.keys(policiesGroupedByTitle).map((title) => (
                <Policy
                  key={title}
                  title={title}
                  policies={policiesGroupedByTitle[title]}
                />
              ))
            ) : (
              <Empty description="No policies found">
                <Button
                  onClick={() => handleManagePolicy(partnerPolicies || [])}
                  type="default"
                >
                  Add Policy
                </Button>
              </Empty>
            )}
          </div>
        </Spin>
      </PageContent>

      <PolicySidebar
        isOpen={isPolicySidebarVisible}
        onClose={hidePolicySidebar}
        onSave={handleSavePolicy}
        policies={selectedPolicy || []}
        setPolicies={setSelectedPolicy}
      />
    </>
  );
};

const Policy: React.FC<{
  title: string;
  policies: PolicyType[];
}> = ({ title, policies }) => {
  return (
    <div className={cn("group relative mb-6", rubikClassName)} key={title}>
      <span className="flex justify-between items-center mb-4">
        {title && (
          <h3 className={cn("text-xl font-semibold self-start")}>{title}</h3>
        )}
      </span>
      {policies.map((policy) => (
        <div
          className="flex gap-4 items-center w-full mb-4 group/policy relative"
          key={`${title}-${policy.id}`}
        >
          {policy.icon && <span className="flex-shrink-0">{policy.icon}</span>}
          <p className="text-sm font-medium relative w-full">
            {policy.description}
          </p>
        </div>
      ))}

      <hr className="horizontal-divider mt-4" />
    </div>
  );
};

export default PartnerPolicy;
