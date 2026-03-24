import {
  DeleteOutlined,
  DragOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader, useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useSortableList, useVisibilityState } from "@zo/utils/hooks";
import { isValidUUID } from "@zo/utils/string";
import { Button, message, Spin } from "antd";
import React, { useState } from "react";
import MediaUploaderDrawer from "../../ui/MediaUploaderDrawer";

interface PartnerInventoryMediaProps {
  inventoryId: string;
  isActive: boolean;
}

const SortableMediaItem: React.FC<{
  item: GeneralObject;
  onDelete: (item: GeneralObject) => void;
}> = ({ item, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id as string,
  });

  const isVideo = item.category === "video" || item.url?.includes("video");

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative  w-48  h-48  overflow-hidden ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="relative w-full h-full">
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              src={item.url}
              className="w-full h-full object-cover"
              muted
            />
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.metadata?.alt || item.metadata?.title || "Media"}
            className="w-full h-full object-cover"
          />
        )}

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 bg-black text-white p-1 cursor-move hover:bg-opacity-75"
        >
          <DragOutlined className="text-sm" />
        </div>

        {/* Delete button */}
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(item)}
          className="absolute top-2 right-2 bg-black text-white hover:bg-red-600 hover:text-white"
        />
      </div>
    </div>
  );
};

const PartnerInventoryMedia: React.FC<PartnerInventoryMediaProps> = ({
  inventoryId,
  isActive,
}) => {
  const [data, setData] = useState<GeneralObject[]>([]);
  const [
    isMediaUploaderDrawerOpen,
    showMediaUploaderDrawer,
    hideMediaUploaderDrawer,
  ] = useVisibilityState();

  const { isLoading, refetch: refetchMedia } = useInfiniteTable({
    queryEndpoint: "CAS_MEDIA",
    name: "media",
    setter: setData,
    additionalRoute: `inventory/${inventoryId}/`,
    customSearchQuery: `ordering=-created_at`,
    enabled: isValidUUID(inventoryId) && isActive,
  });

  const uploaderConfig = {
    route: `inventory/${inventoryId}/`,
    onSuccess: () => {
      refetchMedia();
    },
    onError: (error: unknown) => {
      refetchMedia();
    },
  };

  const { mutate: updateMedia } = useMutationApi("CAS_MEDIA", {}, "", "PUT");
  const { mutate: deleteMedia } = useMutationApi("CAS_MEDIA", {}, "", "DELETE");

  const {
    sortedItems,
    handleDelete,
    dndContextProps,
    sortableContextProps,
    DndContext,
    SortableContext,
    isEmpty,
  } = useSortableList({
    items: data,
    apiConfig: {
      routeBuilder: (item) => {
        return `${item.id}/`;
      },
      customUpdateData: (item, sortIndex) => ({ sort_index: sortIndex }),
      customDeleteData: () => ({}),
    },
    sortField: "sort_index",
    sortDirection: "desc",
    enableUpdate: true,
    enableDelete: true,
    updateMutation: updateMedia,
    deleteMutation: deleteMedia,
    onUpdateSuccess: (updatedItems) => {
      message.success("Media reordered successfully");
      refetchMedia();
    },
    onUpdateError: (error) => {
      message.error(processResponseError(error) || "Failed to reorder media");
    },
    onDeleteSuccess: (deletedItem) => {
      message.success("Media deleted successfully");
      refetchMedia();
    },
    onDeleteError: (error, item) => {
      message.error(processResponseError(error) || "Failed to delete media");
    },
  });

  return (
    <>
      <PageHeader
        title="Inventory Media"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Media",
            onClick: showMediaUploaderDrawer,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        {!isLoading ? (
          <div>
            <DndContext {...dndContextProps}>
              <SortableContext {...sortableContextProps}>
                <div className="grid grid-cols-5 gap-6">
                  {sortedItems.map((item) => (
                    <SortableMediaItem
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {isEmpty && (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <PictureOutlined className="text-4xl mb-4" />
                <p>No media items found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Spin size="large" />
            <div className="mt-2 text-zui-silver">Loading...</div>
          </div>
        )}
      </PageContent>
      <MediaUploaderDrawer
        config={uploaderConfig}
        isOpen={isMediaUploaderDrawerOpen}
        onClose={hideMediaUploaderDrawer}
      />
    </>
  );
};

export default PartnerInventoryMedia;
