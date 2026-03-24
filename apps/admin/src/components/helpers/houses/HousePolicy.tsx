import { EditOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { Alert, App, Button, Empty, Spin, Typography } from "antd";
import { Policy as PolicyType } from "apps/admin/src/config";
import { rubikClassName } from "apps/admin/src/utils";
import React, { useMemo, useState } from "react";
import { PolicySidebar } from "../../sidebars";

const { Title } = Typography;

interface HousePolicyProps {
  operatorId: string;
  refetch: () => void;
}

function groupPoliciesByTitle(policies: PolicyType[]): {
  [key: string]: PolicyType[];
} {
  return policies.reduce((grouped, policy) => {
    const titleKey = policy.title || "";
    if (!grouped[titleKey]) {
      grouped[titleKey] = [];
    }
    grouped[titleKey].push(policy);
    return grouped;
  }, {} as { [key: string]: PolicyType[] });
}

const HousePolicy: React.FC<HousePolicyProps> = ({ operatorId, refetch }) => {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType[]>([]);
  const { message } = App.useApp();

  const [isPolicySidebarVisible, showPolicySidebar, hidePolicySidebar] =
    useVisibilityState(false);

  const {
    data: housePolicies,
    refetch: refetchHousePolicies,
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

  const [hasOriginalDataChanged, setHasOriginalDataChanged] =
    useState<boolean>(false);

  const { mutate: updateBasicInfo } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    "PUT"
  );

  const policiesGroupedByTitle = useMemo(
    () => groupPoliciesByTitle(housePolicies || []),
    [housePolicies]
  );

  const handleSave = () => {
    updateBasicInfo(
      {
        data: {},
        route: `${operatorId}/`,
      },
      {
        onSuccess() {
          message.success("Policy Updated");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

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
            refetchHousePolicies();
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
    <Spin spinning={isLoading}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pt-6 pb-1 grid grid-cols-1 gap-4">
          <div className="flex flex-col flex-grow">
            <Title level={4} className="text-zui-silver uppercase mb-6">
              HOUSE RULES
            </Title>
            {housePolicies?.length ? (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => handleManagePolicy(housePolicies || [])}
                className="mb-4 w-fit"
              >
                Manage Policy
              </Button>
            ) : null}
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
                    onClick={() => handleManagePolicy(housePolicies || [])}
                    type="default"
                  >
                    Add Policy
                  </Button>
                </Empty>
              )}
            </div>
          </div>
        </div>
        {hasOriginalDataChanged && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
            <div className="max-w-screen-xl mx-auto flex justify-end">
              <Button type="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
      <PolicySidebar
        isOpen={isPolicySidebarVisible}
        onClose={hidePolicySidebar}
        onSave={handleSavePolicy}
        policies={selectedPolicy || []}
        setPolicies={setSelectedPolicy}
      />
    </Spin>
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

export default HousePolicy;
