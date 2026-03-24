import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Button, Tag } from "antd";
import { useState } from "react";
import { TripBatchSidebar, TripDateSidebar } from "../../sidebars";

interface TripBatchesProps {
  data: GeneralObject;
}

const TripBatches: React.FC<TripBatchesProps> = ({ data }) => {
  const [isTripBatchVisible, showTripBatch, hideTripBatch] =
    useVisibilityState();
  const [isBatchDatesVisible, showBatchDates, hideBatchDates] =
    useVisibilityState();
  const [selectedBatch, setSelectedBatch] = useState<any>("");

  const handleClose = () => {
    setSelectedBatch("");
    hideTripBatch();
  };

  const handleCloseBatchDates = () => {
    setSelectedBatch("");
    hideBatchDates();
  };

  const {
    refetch,
    data: batches,
    isLoading,
  } = useQueryApi<any[]>(
    "CAS_SKU",
    {
      enabled: !!data?.id,
      select: (data) => data.data.results,
    },
    ``,
    `inventory=${data?.id}`
  );

  const handleRowClick = (record: GeneralObject) => {
    setSelectedBatch(record);
    showBatchDates();
  };

  const handleEditBatch = (e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    setSelectedBatch(record);
    showTripBatch();
  };

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "name",
      dataIndex: "name",
      width: 120,
      render: (cell: any) => {
        return <span>{cell}</span>;
      },
    },

    {
      key: "sellable",
      title: "Status",
      dataIndex: "sellable",
      width: 40,
      render: (cell: any, row: any) => {
        const statusColors: Record<string, string> = {
          false: "warning",
          true: "success",
        };

        return (
          <Tag bordered={false} color={statusColors[cell] || "default"}>
            {cell === true ? "Sellable" : "Unsellable"}
          </Tag>
        );
      },
    },
    {
      key: "itinerary",
      title: "Itinerary",
      dataIndex: "itinerary",
      width: 120,
      render: (row: any) => {
        return <span>{row.title}</span>;
      },
    },
    {
      key: "actions",
      title: "Actions",
      dataIndex: "actions",
      width: "20px",
      render: (_, data) => {
        return (
          <Button
            type="primary"
            danger
            size="small"
            onClick={(e) => handleEditBatch(e, data)}
            className="text-xs"
          >
            Edit
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={`Batches`}
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Batch",
            onClick: showTripBatch,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        <ZudTable
          data={batches || []}
          isLoading={isLoading}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
          onRowClick={handleRowClick}
        />
      </PageContent>
      <TripBatchSidebar
        isOpen={isTripBatchVisible}
        onClose={handleClose}
        refetch={refetch}
        itineraryId={data?.id}
        selectedBatch={selectedBatch}
      />

      <TripDateSidebar
        isOpen={isBatchDatesVisible}
        onClose={handleCloseBatchDates}
        data={data}
        selectedBatch={selectedBatch}
      />
    </>
  );
};

export default TripBatches;
