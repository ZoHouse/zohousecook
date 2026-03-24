import { Drawer, Tabs } from "antd";
import React, { useMemo, useState } from "react";
import {
  InventoryPolicy,
  PartnerInventoryAmenities,
  PartnerInventoryMedia,
  PartnerInventoryRatePlans,
} from "../../helpers/partners";

interface PartnerInventoryInfoProps {
  isOpen: boolean;
  onClose: () => void;
  operatorId: string | undefined;
  inventoryId: string;
  refetch: () => void;
}

const PartnerInventoryDetailSidebar: React.FC<PartnerInventoryInfoProps> = ({
  isOpen,
  onClose,
  inventoryId,
  refetch,
}) => {
  const [activeTab, setActiveTab] = useState("rate_plans");

  const tabItems = useMemo(
    () => [
      {
        key: "rate_plans",
        label: "Rate Plans",
        children: (
          <PartnerInventoryRatePlans
            inventoryId={inventoryId}
            isActive={activeTab === "rate_plans"}
          />
        ),
      },
      {
        key: "policy",
        label: "Policy",
        children: (
          <InventoryPolicy
            inventoryId={inventoryId}
            isActive={activeTab === "policy"}
          />
        ),
      },
      {
        key: "media",
        label: "Media",
        children: (
          <PartnerInventoryMedia
            isActive={activeTab === "media"}
            inventoryId={inventoryId}
          />
        ),
      },
      {
        key: "amenities",
        label: "Amenities",
        children: (
          <PartnerInventoryAmenities
            inventoryId={inventoryId}
            isActive={activeTab === "amenities"}
          />
        ),
      },
    ],
    [activeTab, inventoryId]
  );

  const handleClose = () => {
    onClose();
    setActiveTab("rate_plans");
  };
  return (
    <Drawer
      title="Inventory Details"
      open={isOpen}
      width={1100}
      onClose={handleClose}
      placement="right"
    >
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
    </Drawer>
  );
};

export default PartnerInventoryDetailSidebar;
