import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { PageContent, PageHeader } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString, isValidUUID } from "@zo/utils/string";
import { App, Button, Empty } from "antd";
import { Policy as PolicyType } from "apps/admin/src/config";
import { rubikClassName } from "apps/admin/src/utils";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { AddTripPolicySidebar } from "../../sidebars";

interface TripPolicyProps {
  isActive?: boolean;
  selectedItineraryId: string;
  refetch?: () => void;
}

const TripPolicy: React.FC<TripPolicyProps> = ({
  isActive,
  selectedItineraryId,
}) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [isPolicySidebarVisible, showPolicySidebar, hidePolicySidebar] =
    useVisibilityState(false);

  const [policies, setPolicies] = useState<PolicyType[]>([]);

  const handleManagePolicy = (policies: PolicyType[]) => {
    setPolicies(policies);
    showPolicySidebar();
  };

  const { data: tripPolicies, refetch } = useQueryApi<PolicyType[]>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: isValidUUID(selectedItineraryId) && isActive,
      select: (data) => data.data.results as PolicyType[],
    },
    `${selectedItineraryId}/policies/`,
    "limit=100"
  );

  const { mutate: updateTripPolicy } = useMutationApi(
    "CAS_INVENTORY_ITINERARIES",
    {},
    "",
    `${policies.length === 0 ? "POST" : "PUT"}`
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
    if (selectedItineraryId) {
      updateTripPolicy(
        {
          data: allPolicies,
          route: `${selectedItineraryId}/policies/replace-all/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries(["cas", "inventory"]);
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

  const policiesGroupedByTitle = useMemo(
    () => groupPoliciesByTitle(tripPolicies || []),
    [tripPolicies]
  );

  return (
    <>
      <PageHeader
        title="Policy"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Manage Policies",
            onClick: () => handleManagePolicy(tripPolicies || []),
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        {Object.keys(policiesGroupedByTitle).length > 0 ? (
          Object.keys(policiesGroupedByTitle).map((title) => (
            <div
              className={cn("group relative mb-6", rubikClassName)}
              key={title}
            >
              {title && (
                <h3 className={cn("text-xl font-semibold self-start")}>
                  {title}
                </h3>
              )}
              {policiesGroupedByTitle[title].map((policy) => (
                <div
                  className="flex gap-4 items-center w-full mb-4 group/policy relative"
                  key={`${title}-${policy.id}`}
                >
                  {policy.icon && (
                    <span className="flex-shrink-0">{policy.icon}</span>
                  )}
                  <p className="text-sm font-medium relative w-full">
                    {policy.description}
                  </p>
                </div>
              ))}

              <hr className="horizontal-divider mt-4" />
            </div>
          ))
        ) : (
          <Empty description="No policies found">
            <Button
              onClick={() => handleManagePolicy(tripPolicies || [])}
              type="default"
            >
              Add Policy
            </Button>
          </Empty>
        )}
        <AddTripPolicySidebar
          isOpen={isPolicySidebarVisible}
          onClose={hidePolicySidebar}
          onSave={handleSavePolicy}
          policies={policies || []}
          setPolicies={setPolicies}
        />
      </PageContent>
    </>
  );
};

export default TripPolicy;
