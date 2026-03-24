import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GeneralObject } from "@zo/definitions/general";
import { useEffect, useState } from "react";

interface ApiConfig {
  routeBuilder?: (
    item: GeneralObject,
    additionalParams?: Record<string, unknown>
  ) => string;
  customUpdateData?: (
    item: GeneralObject,
    sortIndex: number
  ) => Record<string, unknown>;
  customDeleteData?: (item: GeneralObject) => Record<string, unknown>;
}

interface MutationConfig {
  data: Record<string, unknown>;
  route: string;
}

interface MutationCallbacks {
  onSuccess?: (response?: unknown) => void;
  onError?: (error: unknown) => void;
}

type MutationFunction = (
  config: MutationConfig,
  callbacks: MutationCallbacks
) => void;

interface UseSortableListProps {
  items: GeneralObject[];
  apiConfig?: ApiConfig;
  sortField?: string; // Field to sort by (default: 'sort_index')
  sortDirection?: "asc" | "desc"; // Sort direction (default: 'desc')
  onReorder?: (items: GeneralObject[]) => void;
  onDeleteSuccess?: (item: GeneralObject) => void;
  onDeleteError?: (error: unknown, item: GeneralObject) => void;
  onUpdateSuccess?: (items: GeneralObject[]) => void;
  onUpdateError?: (error: unknown) => void;
  enableDelete?: boolean;
  enableUpdate?: boolean;
  additionalParams?: Record<string, unknown>; // For building routes
  // Mutation functions - passed from the component using this hook
  updateMutation?: MutationFunction;
  deleteMutation?: MutationFunction;
}

export const useSortableList = ({
  items = [],
  apiConfig = {},
  sortField = "sort_index",
  sortDirection = "desc",
  onReorder,
  onDeleteSuccess,
  onDeleteError,
  onUpdateSuccess,
  onUpdateError,
  enableDelete = true,
  enableUpdate = true,
  additionalParams,
  updateMutation,
  deleteMutation,
}: UseSortableListProps) => {
  const [sortedItems, setSortedItems] = useState<GeneralObject[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort items whenever the items prop changes
  useEffect(() => {
    const sorted = [...items].sort((a, b) => {
      const aValue = (a[sortField] as number) || 0;
      const bValue = (b[sortField] as number) || 0;
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
    setSortedItems(sorted);
  }, [items, sortField, sortDirection]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !enableUpdate) {
      return;
    }

    const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
    const newIndex = sortedItems.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);

      // Calculate new sort indices
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        [sortField]:
          sortDirection === "desc" ? reorderedItems.length - index - 1 : index,
      }));

      // Update local state immediately for smooth UX
      setSortedItems(updatedItems);
      onReorder?.(updatedItems);

      // If mutation function and route builder are provided, make the API calls
      if (updateMutation && apiConfig.routeBuilder) {
        try {
          const updatePromises = updatedItems.map((item, index) => {
            const updateData = apiConfig.customUpdateData
              ? apiConfig.customUpdateData(item, item[sortField] as number)
              : { [sortField]: item[sortField] };

            return new Promise<void>((resolve, reject) => {
              updateMutation(
                {
                  data: updateData,
                  route: apiConfig.routeBuilder!(item, additionalParams),
                },
                {
                  onSuccess: () => {
                    if (index === updatedItems.length - 1) {
                      onUpdateSuccess?.(updatedItems);
                    }
                    resolve();
                  },
                  onError: (error) => {
                    onUpdateError?.(error);
                    reject(error);
                  },
                }
              );
            });
          });

          await Promise.all(updatePromises);
        } catch (error) {
          setSortedItems(items);
          onReorder?.(items);
        }
      }
    }
  };

  const handleDelete = (item: GeneralObject) => {
    if (!enableDelete) return;

    if (deleteMutation && apiConfig.routeBuilder) {
      const deleteData = apiConfig.customDeleteData
        ? apiConfig.customDeleteData(item)
        : { [sortField]: item[sortField] };

      deleteMutation(
        {
          data: deleteData,
          route: apiConfig.routeBuilder(item, additionalParams),
        },
        {
          onSuccess: () => {
            onDeleteSuccess?.(item);
          },
          onError: (error) => {
            onDeleteError?.(error, item);
          },
        }
      );
    } else {
      // If no mutation function, just call the success callback
      onDeleteSuccess?.(item);
    }
  };

  const dndContextProps = {
    sensors,
    collisionDetection: closestCenter,
    onDragEnd: handleDragEnd,
  };

  const sortableContextProps = {
    items: sortedItems.map((item) => item.id as string),
    strategy: verticalListSortingStrategy,
  };

  return {
    sortedItems,
    handleDelete,
    dndContextProps,
    sortableContextProps,
    DndContext,
    SortableContext,
    // Additional utilities
    isEmpty: sortedItems.length === 0,
    itemCount: sortedItems.length,
  };
};
