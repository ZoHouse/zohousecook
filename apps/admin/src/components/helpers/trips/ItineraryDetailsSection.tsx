import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useSortableList, useVisibilityState } from "@zo/utils/hooks";
import { Button, Card, Empty, message } from "antd";
import { useState } from "react";
import { EditItineraryDetailsSidebar } from "../../sidebars";
import AddItineraryDetailSidebar from "../../sidebars/ItineraryDetailsSidebar";

interface ItineraryDetailsSectionProps {
  title: string;
  items: GeneralObject[];
  section: string;
  selectedItinerary: string;
  baseRoute: string;
  onReorder?: (items: GeneralObject[]) => void;
  refetch?: () => void;
}

interface SortableItemProps {
  item: GeneralObject;
  section: string;
  onEdit?: (item: GeneralObject) => void;
  onDelete?: (item: GeneralObject) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  section,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = () => onEdit?.(item);
  const handleDelete = () => onDelete?.(item);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zui-light p-4 mb-2"
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <div
          className="cursor-move flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors pt-1"
          {...listeners}
        >
          <HolderOutlined className="text-lg" />
        </div>
        <div className="flex-grow">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              {section === "faq" && (
                <h3 className="text-lg font-semibold">
                  {item.title || "Untitled"}
                </h3>
              )}
              <div className="flex gap-2 ml-auto">
                {section !== "essentials" && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                  />
                )}
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              {section !== "faq" && (
                <span className="text-xl leading-none">
                  {item.icon || "📋"}
                </span>
              )}
              <div className="text-zui-white flex-grow leading-relaxed">
                {item.description || "No description"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItineraryDetailsSection: React.FC<ItineraryDetailsSectionProps> = ({
  title,
  items = [],
  section,
  selectedItinerary,
  baseRoute,
  onReorder,
  refetch,
}) => {
  const [selectedItem, setSelectedItem] = useState<GeneralObject | null>(null);
  const [selectedBaseRoute, setSelectedBaseRoute] = useState<string>("");
  const [
    isItinerariesAddDetailVisible,
    showItinerariesAddDetailSidebar,
    hideItinerariesAddDetailSidebar,
  ] = useVisibilityState(false);

  const [
    isItinerariesEditDetailVisible,
    showItinerariesDetailSidebar,
    hideItinerariesDetailSidebar,
  ] = useVisibilityState(false);

  // API mutations for sorting and deleting
  const { mutate: sortItinerariesDetails } = useMutationApi(
    "CAS_INVENTORY_ITINERARIES",
    {},
    "",
    "PUT"
  );

  const { mutate: deleteItineraryDetails } = useMutationApi(
    "CAS_INVENTORY_ITINERARIES",
    {},
    "",
    "DELETE"
  );

  const { mutate: deleteItineraryEssentials } = useMutationApi(
    "CAS_ESSENTIALS_INVENTORY_ITINERARIES",
    {},
    "",
    "DELETE"
  );

  // Use the global sorting hook directly
  const {
    sortedItems,
    handleDelete: handleDeleteItem,
    dndContextProps,
    sortableContextProps,
    DndContext,
    SortableContext,
  } = useSortableList({
    items,
    onReorder,
    apiConfig: {
      routeBuilder: (item: GeneralObject) => {
        return section === "essentials"
          ? `/${selectedItinerary}/${baseRoute}/${item?.id}/`
          : `${selectedItinerary}/${baseRoute}/${item?.id}/`;
      },
    },
    updateMutation: (config, callbacks) => {
      sortItinerariesDetails(config, callbacks);
    },
    deleteMutation: (config, callbacks) => {
      if (section === "essentials") {
        deleteItineraryEssentials(config, callbacks);
      } else {
        deleteItineraryDetails(config, callbacks);
      }
    },
    onUpdateSuccess: () => {
      message.success("item updated successfully");
      refetch?.();
    },
    onUpdateError: (error) => {
      message.error(processResponseError(error) || "Failed to reorder item");
    },
    onDeleteSuccess: () => {
      message.success("item deleted successfully");
      refetch?.();
    },
    onDeleteError: (error) => {
      message.error(processResponseError(error) || "Failed to delete item");
    },
  });

  const handleAdd = () => {
    setSelectedBaseRoute(baseRoute);
    showItinerariesAddDetailSidebar();
  };

  const handleEditItineraryDetail = (item: GeneralObject) => {
    setSelectedItem(item);
    setSelectedBaseRoute(baseRoute);
    showItinerariesDetailSidebar();
  };

  const renderItems = () => {
    if (sortedItems.length === 0) {
      return (
        <div className="flex items-center justify-center h-32">
          <Empty
            description={`No ${title.toLowerCase()} added yet`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <DndContext {...dndContextProps}>
        <SortableContext {...sortableContextProps}>
          {sortedItems.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              section={section}
              onEdit={handleEditItineraryDetail}
              onDelete={handleDeleteItem}
            />
          ))}
        </SortableContext>
      </DndContext>
    );
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add
          </Button>
        </div>
        <div className="border-t mb-4 border-zui-light"></div>

        <div className="h-80 overflow-y-auto">{renderItems()}</div>
      </Card>
      <AddItineraryDetailSidebar
        isOpen={isItinerariesAddDetailVisible}
        onClose={hideItinerariesAddDetailSidebar}
        selectedItinerary={selectedItinerary}
        section={section}
        baseRoute={selectedBaseRoute}
        refetch={refetch}
      />
      <EditItineraryDetailsSidebar
        isOpen={isItinerariesEditDetailVisible}
        onClose={hideItinerariesDetailSidebar}
        selectedItem={selectedItem}
        selectedItinerary={selectedItinerary}
        section={section}
        baseRoute={selectedBaseRoute}
        refetch={refetch}
      />
    </>
  );
};

export default ItineraryDetailsSection;
