import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { isValidString } from "@zo/utils/string";
import { Button, Collapse, Empty, Spin, Tooltip, Typography } from "antd";
import { Space } from "apps/admin/src/config";
import React from "react";
import SpaceCard from "./SpaceCard";

const { Title } = Typography;

interface FloorAccordionProps {
  name: string;
  estateId: string;
  floorId: string;
  addSpaceHandler: () => void;
  onEdit: (floorId: string) => void;
  onDelete: (floorId: string) => void;
  onSpaceDelete: (spaceId: string, refetch: () => void) => void;
  onSpaceEdit: (spaceId: string) => void;
}

const FloorAccordion: React.FC<FloorAccordionProps> = ({
  name,
  estateId,
  floorId,
  onDelete,
  onEdit,
  addSpaceHandler,
  onSpaceDelete,
  onSpaceEdit,
}) => {
  const {
    data: spaces,
    refetch,
    isLoading,
  } = useQueryApi<Space[]>(
    "CAS_SPACES",
    {
      enabled: isValidString(estateId),
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    "",
    `floor=${floorId}&limit=-1`
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(floorId);
  };

  const handleFloorEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(floorId);
  };

  const extra = (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip title="Edit Floor">
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={handleFloorEdit}
          size="small"
        />
      </Tooltip>
      <Tooltip title="Delete Floor">
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          size="small"
          danger
        />
      </Tooltip>
    </div>
  );

  return (
    <Collapse
      className="w-full md:w-1/2"
      items={[
        {
          key: "1",
          label: <Title level={5}>{name || "No Name"}</Title>,
          extra: extra,
          children: (
            <>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addSpaceHandler}
                className="mb-4 w-fit"
                block
              >
                Add Space
              </Button>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Spin tip="Loading spaces..." />
                </div>
              ) : spaces && spaces.length > 0 ? (
                <div className="space-y-2">
                  {spaces.map((space: Space) => (
                    <SpaceCard
                      category={space.category}
                      name={space.name || "No Name"}
                      onDelete={onSpaceDelete.bind(null, space.id, refetch)}
                      key={space.id}
                      spaceId={space.id}
                      onClick={onSpaceEdit.bind(null, space.id)}
                    />
                  ))}
                </div>
              ) : (
                <Empty description="No spaces found" className="my-4" />
              )}
            </>
          ),
        },
      ]}
    />
  );
};

export default FloorAccordion;
