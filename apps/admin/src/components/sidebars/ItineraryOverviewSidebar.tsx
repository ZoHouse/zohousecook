import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidUUID } from "@zo/utils/string";
import { Button, Drawer, Tabs } from "antd";
import React, { useMemo, useState } from "react";
import {
  TripItineraryDetail,
  TripItineraryMedia,
  TripItineraryStop,
  TripPolicy,
} from "../helpers/trips";
import DuplicateItineraryDetailsSidebar from "./DuplicateItineraryDetailsSidebar";

interface ItineraryOverviewSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItineraryId: string;
}

const ItineraryOverviewSidebar: React.FC<ItineraryOverviewSidebarProps> = ({
  isOpen,
  onClose,
  selectedItineraryId,
}) => {
  const [activeTab, setActiveTab] = useState("stops");
  const [
    isDuplicateItineraryDetailsVisible,
    showDuplicateItineraryDetailsInfo,
    hideDuplicateItineraryDetailsInfo,
  ] = useVisibilityState();

  const { data: itinerary, isLoading } = useQueryApi<GeneralObject>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: isOpen && isValidUUID(selectedItineraryId),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/`
  );

  const tabItems = useMemo(
    () => [
      {
        key: "stops",
        label: "Stops",
        children: (
          <TripItineraryStop
            selectedItinerary={selectedItineraryId}
            isActive={activeTab === "stops"}
          />
        ),
      },
      {
        key: "details",
        label: "Itinerary Details",
        children: (
          <TripItineraryDetail
            selectedItinerary={selectedItineraryId}
            isActive={activeTab === "details"}
          />
        ),
      },
      {
        key: "images",
        label: "Images",
        children: (
          <TripItineraryMedia
            isActive={activeTab === "images"}
            selectedItineraryId={selectedItineraryId}
          />
        ),
      },
      {
        key: "policy",
        label: "Policy",
        children: (
          <TripPolicy
            isActive={activeTab === "policy"}
            selectedItineraryId={selectedItineraryId}
          />
        ),
      },
    ],
    [selectedItineraryId, activeTab]
  );

  const handleClose = () => {
    onClose();
    setActiveTab("stops");
  };
  return (
    <Drawer
      title={`${itinerary?.title || ""}  Itinerary Overview (${
        itinerary?.duration || 0
      } days)`}
      open={isOpen}
      width={1100}
      onClose={handleClose}
      placement="right"
      extra={
        <Button
          icon={<AddOutlinedIcon />}
          type="primary"
          onClick={showDuplicateItineraryDetailsInfo}
        >
          Duplicate Itinerary Details
        </Button>
      }
    >
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      <DuplicateItineraryDetailsSidebar
        isOpen={isDuplicateItineraryDetailsVisible}
        onClose={hideDuplicateItineraryDetailsInfo}
        selectedItinerary={selectedItineraryId}
      />
    </Drawer>
  );
};

export default ItineraryOverviewSidebar;
