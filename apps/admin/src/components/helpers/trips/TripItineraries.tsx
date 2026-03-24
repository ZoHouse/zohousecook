import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader, useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Button, Tag } from "antd";
import React, { useMemo, useState } from "react";
import { AddItinerarySidebar, ItineraryOverviewSidebar } from "../../sidebars";

interface TripItinerariesProps {
  data: GeneralObject;
}

const TripItineraries: React.FC<TripItinerariesProps> = ({ data }) => {
  const [selectedItinerary, setSelectedItinerary] = useState<string>("");
  const [itineraries, setItineraries] = useState<GeneralObject[]>([]);
  const [isItineraryVisible, showItineraryInfo, hideItineraryInfo] =
    useVisibilityState();

  const [isItinerariesVisible, showItinerariesInfo, hideItinerariesInfo] =
    useVisibilityState();

  const handleCloseItinerary = () => {
    setSelectedItinerary("");
    hideItineraryInfo();
  };

  const { refetch, isLoading } = useInfiniteTable({
    setter: setItineraries,
    queryEndpoint: "CAS_INVENTORY_ITINERARIES",
    name: "",
    enabled: isValidString(data?.id),
    customSearchQuery: `inventory=${data?.id}`,
  });

  const handleItineraryDetails = (itineraryId: string) => {
    setSelectedItinerary(itineraryId);
    showItineraryInfo();
  };

  const handleItineraryEdit = (itineraryId: string) => {
    setSelectedItinerary(itineraryId);
    showItinerariesInfo();
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "title",
        title: "Title",
        dataIndex: "title",
      },
      {
        title: "Duration",
        dataIndex: "duration",
        key: "duration",
        render: (cell) => (
          <span>
            {cell} Day
            {cell !== 1 ? "s" : ""}
          </span>
        ),
      },

      {
        title: "Pickup Location",
        dataIndex: "pickup_location",
        key: "pickup_location",
      },
      {
        title: "Drop Location",
        dataIndex: "drop_location",
        key: "drop_location",
      },
      {
        title: "Insurance Included",
        dataIndex: "has_insurance_included",
        key: "has_insurance_included",
        render: (cell) => (
          <Tag color={cell ? "green" : "red"} bordered={true}>
            {cell ? "Yes" : "No"}
          </Tag>
        ),
      },
      {
        title: "Action",
        dataIndex: "id",
        key: "id",
        render: (cell) => (
          <Button
            type="text"
            icon={<EditOutlinedIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleItineraryEdit(cell);
            }}
          />
        ),
      },
    ],
    []
  );

  const handleCloseItineraries = () => {
    setSelectedItinerary("");
    hideItinerariesInfo();
  };

  return (
    <div>
      <PageHeader
        title="Itineraries"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Itinerary",
            onClick: showItinerariesInfo,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        <ZudTable
          data={itineraries || []}
          isLoading={isLoading}
          columns={columns}
          onRowClick={(record) => {
            handleItineraryDetails(record.id);
          }}
        />
      </PageContent>

      <ItineraryOverviewSidebar
        isOpen={isItineraryVisible}
        onClose={handleCloseItinerary}
        selectedItineraryId={selectedItinerary}
      />

      <AddItinerarySidebar
        isOpen={isItinerariesVisible}
        onClose={handleCloseItineraries}
        itineraryId={data?.id}
        refetch={refetch}
        selectedItineraryId={selectedItinerary}
      />
    </div>
  );
};

export default TripItineraries;
