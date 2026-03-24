import {
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useSortableList, useVisibilityState } from "@zo/utils/hooks";
import { isValidUUID } from "@zo/utils/string";
import { App, Button, Spin, Typography } from "antd";
import { Itinerary } from "apps/admin/src/config/typings";
import React, { useState } from "react";
import { TripItineraryStopDetailSidebar } from "../../sidebars";
import MediaUploaderDrawer from "../../ui/MediaUploaderDrawer";

interface TripItineraryStopProps {
  isActive: boolean;
  selectedItinerary: string;
}

const { Title, Paragraph } = Typography;

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

const TripItineraryStop: React.FC<TripItineraryStopProps> = ({
  selectedItinerary,
  isActive,
}) => {
  const { message } = App.useApp();

  const [editItinerary, setEditItinerary] = useState<any>(null);
  const [selectedItineraryStop, setSelectedItineraryStop] = useState<any>(null);

  const [isItineraryVisible, showItineraryInfo, hideItineraryInfo] =
    useVisibilityState();
  const [
    isMediaUploaderDrawerOpen,
    showMediaUploaderDrawer,
    hideMediaUploaderDrawer,
  ] = useVisibilityState();

  const { mutate: updateMedia } = useMutationApi("CAS_MEDIA", {}, "", "PUT");

  const {
    refetch,
    data: tripItinerary,
    isLoading: isItineraryLoading,
  } = useQueryApi<any[]>(
    "CAS_ITINERARY_STOPS",
    {
      enabled: isValidUUID(selectedItinerary) && isActive,
      select: (data) => data.data.results,
    },
    ``,
    `itinerary=${selectedItinerary}`
  );

  const { mutate: deleteMedia, isLoading: isDeleteLoading } = useMutationApi(
    "CAS_MEDIA",
    {},
    "",
    "DELETE"
  );

  const uploaderConfig = {
    route: `itinerary_stop/${selectedItineraryStop}/`,
    onSuccess: () => {
      refetch();
    },
    onError: (error: unknown) => {
      refetch();
    },
  };

  const handleItinerarySelect = (data: any) => {
    setEditItinerary(data);
    showItineraryInfo();
  };

  const handleItineraryAdd = () => {
    setEditItinerary(0);
    showItineraryInfo();
  };

  const handleMediaUpload = (id: string) => {
    setSelectedItineraryStop(id);
    showMediaUploaderDrawer();
  };

  const ItineraryCard: React.FC<{ data: Itinerary }> = ({ data }) => {
    const [isMediaLoading, setIsMediaLoading] = useState(false);

    const {
      sortedItems: itinerarySortedItems,
      handleDelete: itineraryHandleDelete,
      dndContextProps: itineraryDndContextProps,
      sortableContextProps: itinerarySortableContextProps,
      DndContext: ItineraryDndContext,
      SortableContext: ItinerarySortableContext,
      isEmpty: itineraryIsEmpty,
    } = useSortableList({
      items: data.media || [],
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
        setIsMediaLoading(false);
        refetch();
      },
      onUpdateError: (error) => {
        message.error(processResponseError(error) || "Failed to reorder media");
        setIsMediaLoading(false);
      },
      onDeleteSuccess: (deletedItem) => {
        message.success("Media deleted successfully");
        setIsMediaLoading(false);
        refetch();
      },
      onDeleteError: (error, item) => {
        message.error(processResponseError(error) || "Failed to delete media");
        setIsMediaLoading(false);
      },
    });

    // Enhanced delete handler with loading state
    const handleDeleteWithLoading = (item: any) => {
      setIsMediaLoading(true);
      itineraryHandleDelete(item);
    };

    // Enhanced DnD context props with loading states
    const enhancedDndContextProps = {
      ...itineraryDndContextProps,
      onDragEnd: (event: any) => {
        setIsMediaLoading(true);

        // Call original onDragEnd handler
        const originalResult = itineraryDndContextProps.onDragEnd?.(event);

        // Handle promise if onDragEnd returns one
        if (originalResult && typeof originalResult.then === "function") {
          originalResult.finally(() => {
            setTimeout(() => setIsMediaLoading(false), 300);
          });
        } else {
          setTimeout(() => setIsMediaLoading(false), 300);
        }

        return originalResult;
      },
    };

    return (
      <div className="bg-zui-dark  border border-zui-light overflow-hidden shadow-md">
        <div className="flex h-80">
          {/* Left Section – Itinerary Info */}
          <div className="bg-zui-darker flex flex-col h-full w-1/2 relative">
            {/* Always-visible Edit/Delete Icons */}
            <div className="absolute top-3 right-3 z-10 flex space-x-2">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleItinerarySelect(data)}
                className="text-zui-silver hover:text-white"
              />
            </div>

            <div className="p-4 pr-12 border-b border-zui-light">
              <div className="text-sm text-zui-silver mb-1 font-medium">
                Day {data.day}
              </div>
              <h3 className="text-xl font-semibold text-zui-white mb-2">
                {data.title}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 max-h-[280px]">
              <Paragraph className="text-zui-silver leading-relaxed whitespace-pre-line">
                {data.description}
              </Paragraph>
            </div>
          </div>

          {/* Right Section – Images */}
          <div className="bg-zui-lighter flex flex-col h-full w-1/2">
            <div className="p-4 border-b border-zui-light flex justify-between items-center">
              <Title level={5} className="text-zui-silver m-0">
                Images ({data.media?.length || 0})
              </Title>
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={() => handleMediaUpload(data.id)}
              >
                Add
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-h-[320px] space-y-3 relative">
              {isMediaLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <Spin size="large" />
                </div>
              )}

              {itinerarySortedItems && itinerarySortedItems.length > 0 ? (
                <ItineraryDndContext {...enhancedDndContextProps}>
                  <ItinerarySortableContext {...itinerarySortableContextProps}>
                    <div className="grid grid-cols-2 gap-3">
                      {itinerarySortedItems.map((item) => (
                        <SortableMediaItem
                          key={item.id}
                          item={item}
                          onDelete={handleDeleteWithLoading}
                        />
                      ))}
                    </div>
                  </ItinerarySortableContext>
                </ItineraryDndContext>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <PictureOutlined className="text-4xl mb-4" />
                  <p>No media items found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Stops"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Stop",
            onClick: handleItineraryAdd,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        {!isItineraryLoading ? (
          tripItinerary && tripItinerary.length > 0 ? (
            tripItinerary.map((itinerary: Itinerary) => (
              <div key={itinerary.id} className="pb-6">
                <ItineraryCard data={itinerary} />
              </div>
            ))
          ) : (
            <div className="text-center p-8 text-zui-silver">
              <Typography.Text>No itinerary items found</Typography.Text>
            </div>
          )
        ) : (
          <div className="py-8 text-center">
            <Spin size="large" />
            <div className="mt-2 text-zui-silver">Loading...</div>
          </div>
        )}
      </PageContent>

      <TripItineraryStopDetailSidebar
        data={editItinerary}
        isOpen={isItineraryVisible}
        onClose={hideItineraryInfo}
        selectedItinerary={selectedItinerary}
        refetch={refetch}
      />
      <MediaUploaderDrawer
        config={uploaderConfig}
        isOpen={isMediaUploaderDrawerOpen}
        onClose={hideMediaUploaderDrawer}
      />
    </div>
  );
};

export default TripItineraryStop;
