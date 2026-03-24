import EditOutlined from "@mui/icons-material/EditOutlined";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader, useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidUUID } from "@zo/utils/string";
import { Card, Divider, Spin, Tag, Tooltip, Typography } from "antd";
import React, { useState } from "react";
import PartnerRatePlanEditSidebar from "../../sidebars/partner/PartnerRatePlanEditSidebar";

const { Text, Title } = Typography;

interface PartnerInventoryRatePlansProps {
  inventoryId: string;
  isActive: boolean;
}

const PartnerInventoryRatePlans: React.FC<PartnerInventoryRatePlansProps> = ({
  inventoryId,
  isActive,
}) => {
  const [data, setData] = useState<GeneralObject[]>([]);
  const [selectedRatePlan, setSelectedRatePlan] =
    useState<GeneralObject | null>(null);

  const [isEditSidebarVisible, showEditSidebar, hideEditSidebar] =
    useVisibilityState();

  const { isLoading, refetch } = useInfiniteTable({
    queryEndpoint: "CAS_INVENTORY_RATE_PLANS",
    name: "ratePlans",
    setter: setData,
    customSearchQuery: `inventory=${inventoryId}`,
    enabled: isValidUUID(inventoryId) && isActive,
  });

  const activeRatePlansCount = data.filter(
    (plan) => plan.status === "active"
  ).length;

  const handleEditClick = (
    e: React.MouseEvent<HTMLSpanElement>,
    plan: GeneralObject
  ) => {
    e.stopPropagation();
    
    if (plan.status === "active" && activeRatePlansCount === 1) {
      return;
    }
    
    setSelectedRatePlan(plan);
    showEditSidebar();
  };

  const handleEditClose = () => {
    hideEditSidebar();
    setSelectedRatePlan(null);
  };

  return (
    <>
      <PageHeader title="Inventory Rate Plans" />
      <PageContent>
        {!isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data && data.length > 0 ? (
              data.map((plan: GeneralObject) => (
                <Card
                  key={plan.id}
                  className="bg-zui-dark hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Title level={5} className="text-white m-0">
                      {plan.label_public}
                    </Title>
                    <div className="flex items-center gap-2">
                      {plan.status === "active" && activeRatePlansCount === 1 ? (
                        <Tooltip title="At least one rate plan needs to be active">
                          <span
                            className="cursor-not-allowed text-zui-silver/50 transition-colors"
                          >
                            <EditOutlined fontSize="small" />
                          </span>
                        </Tooltip>
                      ) : (
                        <span
                          onClick={(e) => handleEditClick(e, plan)}
                          className="cursor-pointer text-zui-silver hover:text-zui-neon transition-colors"
                        >
                          <EditOutlined fontSize="small" />
                        </span>
                      )}
                      <Tag
                        className={`uppercase border-0 ${
                          plan.status === "active"
                            ? "bg-zui-neon text-zui-dark"
                            : "bg-zui-red text-zui-dark"
                        }`}
                      >
                        {plan.status}
                      </Tag>
                    </div>
                  </div>

                  <Text className="text-zui-silver block mb-6 line-clamp-2">
                    {plan.description || "No description available."}
                  </Text>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zui-silver/70 font-semibold mb-1">
                        PID
                      </p>
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        {plan.pid}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zui-silver/70 font-semibold mb-1">
                        Channel Ref
                      </p>
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        {plan.channel_ref_id}
                      </p>
                    </div>

                    {(plan.max_bookable_units || plan.min_bookable_units) && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zui-silver/70 font-semibold mb-1">
                          Units Range
                        </p>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          {plan.min_bookable_units || 0} -{" "}
                          {plan.max_bookable_units || "∞"}
                        </p>
                      </div>
                    )}
                  </div>

                  <Divider className="border-zui-silver my-4" />

                  <Text className="text-zui-silver text-xs">
                    Created:{" "}
                    {new Date(plan.created_at).toLocaleDateString("en-GB")}
                  </Text>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No rate plans found.
              </div>
            )}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Spin size="large" />
            <div className="mt-2 text-gray-400">Loading rate plans...</div>
          </div>
        )}
      </PageContent>

      <PartnerRatePlanEditSidebar
        isOpen={isEditSidebarVisible}
        onClose={handleEditClose}
        ratePlan={selectedRatePlan}
        refetch={refetch}
      />
    </>
  );
};

export default PartnerInventoryRatePlans;
