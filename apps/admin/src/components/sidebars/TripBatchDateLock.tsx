import { DeleteOutlined } from "@mui/icons-material";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useMemo, useState } from "react";
import { AddTripBatchDateLockSidebar } from ".";

interface TripBatchDateLockSidebarProps {
  selectedDate: string;
  selectedBatch: GeneralObject;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const TripBatchDateLockSidebar: React.FC<TripBatchDateLockSidebarProps> = ({
  selectedDate,
  selectedBatch,
  isOpen,
  onClose,
  refetch,
}) => {
  const [form] = useForm();

  const [isAddLockUnitsVisible, showAddLockUnits, hideAddLockUnits] =
    useVisibilityState();

  const [locking, setLocking] = useState<GeneralObject[]>([]);
  const [selectedLockUnit, setSelectedLockUnit] = useState<GeneralObject>();

  const { isLoading, refetch: refetchLockUnit } = useInfiniteTable({
    setter: setLocking,
    queryEndpoint: "CAS_SKU",
    customSearchQuery: `type=trip&date=${selectedDate}`,
    name: "trips",
    additionalRoute: `${selectedBatch?.id}/locking/`,
    enabled: !!selectedBatch?.id && !!selectedDate,
  });

  const { mutate: deleteLockUnit, isLoading: isDeletingLockUnit } =
    useMutationApi("CAS_SKU", {}, "", "DELETE");

  const handleClose = () => {
    onClose();
    form.resetFields();
  };

  const handleLockUnitsClose = () => {
    hideAddLockUnits();
    setSelectedLockUnit(undefined);
  };

  const handleDelete = (e: React.MouseEvent, item: GeneralObject) => {
    e.stopPropagation();
    deleteLockUnit(
      { data: {}, route: `${item?.sku}/locking/${item?.id}/` },
      {
        onSuccess() {
          refetchLockUnit();
          refetch();
          message.success("Lock unit deleted successfully");
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "release",
        title: "Release",
        dataIndex: "release",
        render: (cell: any, row: any) => {
          return (
            <span className="text-sm font-semibold">
              {cell === "on-demand" ? "Auto Unlocking" : "Manual Unlocking"}
            </span>
          );
        },
      },
      {
        key: "units",
        title: "Units",
        dataIndex: "units",
      },
      {
        key: "reason",
        title: "Reason",
        dataIndex: "reason",
      },
      {
        key: "action",
        title: "Action",
        dataIndex: "action",
        render: (cell: any, row: any) => {
          return (
            <div className="flex gap-4 mt-2">
              <DeleteOutlined
                onClick={(e) => handleDelete(e, row)}
                className="cursor-pointer text-zui-red hover:text-zui-red/50"
              />
            </div>
          );
        },
      },
    ],
    []
  );

  const handleRowClick = (record: GeneralObject) => {
    setSelectedLockUnit(record);
    showAddLockUnits();
  };

  return (
    <Drawer
      title={`Lock Units ${selectedBatch?.name} (
              ${selectedBatch?.itinerary?.title})`}
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={600}
      className="dark-theme-drawer"
      extra={
        <Button onClick={showAddLockUnits} loading={isLoading} type="primary">
          Lock Unit
        </Button>
      }
    >
      <Spin spinning={isLoading || isDeletingLockUnit}>
        <ZudTable
          data={locking || []}
          isLoading={isLoading}
          columns={columns}
          keyExtractor={(row) => row?.date?.toString()}
          onRowClick={(record) => handleRowClick(record)}
        />
      </Spin>

      <AddTripBatchDateLockSidebar
        selectedLockUnit={selectedLockUnit || {}}
        isOpen={isAddLockUnitsVisible}
        onClose={handleLockUnitsClose}
        refetch={refetchLockUnit}
        selectedBatch={selectedBatch}
        selectedDate={selectedDate}
      />
    </Drawer>
  );
};

export default TripBatchDateLockSidebar;
