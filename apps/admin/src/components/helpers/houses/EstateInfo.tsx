import Icon from "@zo/assets/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { Alert, App, Button, Empty, Skeleton, Spin } from "antd";
import { Floor } from "apps/admin/src/config";
import React, { useState } from "react";
import { FloorAndSpaceSidebar } from "../../sidebars";
import FloorAccordion from "./FloorAccordion";

interface EstateInfoProps {
  estateId: string;
}

const EstateInfo: React.FC<EstateInfoProps> = ({ estateId }) => {
  const { message } = App.useApp();
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [inputType, setInputType] = useState<"Floor" | "Space">("Floor");

  const [
    isFloorSpaceSidebarVisible,
    showFloorSpaceSidebar,
    hideFloorSpaceSidebar,
  ] = useVisibilityState();

  const {
    data: floors,
    refetch,
    isLoading,
    isError,
    error,
  } = useQueryApi<Floor[]>(
    "CAS_FLOORS",
    {
      enabled: isValidString(estateId),
      select: (data) => data.data.results,
      refetchOnWindowFocus: false,
    },
    "",
    `estate=${estateId}`
  );

  const { mutate: deleteFloor, isLoading: isDeletingFloor } = useMutationApi(
    "CAS_FLOORS",
    {},
    "",
    "DELETE"
  );

  const { mutate: deleteSpace, isLoading: isDeletingSpace } = useMutationApi(
    "CAS_SPACES",
    {},
    "",
    "DELETE"
  );

  const handleClose = () => {
    setSelectedEntity(null);
    hideFloorSpaceSidebar();
  };

  const handleFloorEdit = (floorId: string) => {
    setInputType("Floor");
    setSelectedEntity(floorId);
    showFloorSpaceSidebar();
  };

  const handleSpaceEdit = (spaceId: string) => {
    setInputType("Space");
    setSelectedEntity(spaceId);
    showFloorSpaceSidebar();
  };

  const handleAddFloor = () => {
    setSelectedEntity(null);
    setInputType("Floor");
    showFloorSpaceSidebar();
  };

  const handleAddSpace = () => {
    setSelectedEntity(null);
    setInputType("Space");
    showFloorSpaceSidebar();
  };

  const handleDeleteSpace = (spaceId: string, refetch: () => void) => {
    deleteSpace(
      { data: {}, route: `${spaceId}/` },
      {
        onSuccess() {
          message.success("Space Deleted");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleDeleteFloor = (floorId: string) => {
    deleteFloor(
      { data: {}, route: `${floorId}/` },
      {
        onSuccess() {
          message.success("Floor Deleted");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((key) => (
          <div key={key} className="w-full md:w-1/2">
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        message="Error"
        description={processResponseError(error)}
        type="error"
        showIcon
        className="mb-4"
      />
    );
  }

  return (
    <Spin spinning={isDeletingFloor || isDeletingSpace}>
      <div className="space-y-4 mt-6">
        {floors && floors.length > 0 ? (
          <>
            {floors.map((floor: Floor) => (
              <FloorAccordion
                floorId={floor.id}
                name={floor.name}
                key={floor.id}
                estateId={estateId}
                onDelete={handleDeleteFloor}
                onEdit={handleFloorEdit}
                addSpaceHandler={handleAddSpace}
                onSpaceDelete={handleDeleteSpace}
                onSpaceEdit={handleSpaceEdit}
              />
            ))}
          </>
        ) : (
          <Empty description="No floors found" className="my-8">
            <Button type="primary" onClick={handleAddFloor}>
              Create Now
            </Button>
          </Empty>
        )}

        {floors && floors.length > 0 && (
          <Button
            className="w-full mt-4 md:w-1/2"
            type="default"
            size="large"
            icon={<Icon name="Plus" size={24} />}
            onClick={handleAddFloor}
          >
            Add New Floor
          </Button>
        )}

        <FloorAndSpaceSidebar
          estateId={estateId}
          input={inputType}
          isOpen={isFloorSpaceSidebarVisible}
          onClose={handleClose}
          entityId={selectedEntity}
          refetchFloors={refetch}
        />
      </div>
    </Spin>
  );
};

export default EstateInfo;
