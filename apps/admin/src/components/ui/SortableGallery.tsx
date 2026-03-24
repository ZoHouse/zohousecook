import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Image, Modal, Tooltip } from "antd";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

interface MediaItem {
  id: string;
  category: string;
  url: string;
  sort_index: number;
  metadata: {
    alt: string;
    title: string;
    priority: number;
  };
}

interface SortableWrapperProps {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
}
interface DefaultSortableItemProps {
  id: string;
  item: MediaItem;
  onDelete?: (id: string) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  showPreview?: boolean;
  showDelete?: boolean;
}

// Making the interface more generic and customizable
interface SortableGalleryProps<T extends { id: string; sort_index: number }> {
  items: T[];
  onDelete?: (id: string) => void;
  onSort: (sortedItems: T[]) => void;
  disabled?: boolean;
  renderItem?: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  itemWidth?: number;
  itemHeight?: number;
  showPreview?: boolean;
  showDelete?: boolean;
}

function SortableGallery<T extends MediaItem>({
  items: initialItems,
  onDelete,
  onSort,
  disabled = false,
  renderItem,
  emptyMessage = "No items available",
  itemWidth = 120,
  itemHeight = 120,
  showPreview = true,
  showDelete = true,
}: SortableGalleryProps<T>) {
  const [items, setItems] = useState<T[]>(() =>
    [...initialItems].sort((a, b) => b.sort_index - a.sort_index)
  );

  const sortedItems = useMemo(
    () => [...initialItems].sort((a, b) => b.sort_index - a.sort_index),
    [initialItems]
  );

  useEffect(() => {
    setItems(sortedItems);
  }, [sortedItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (disabled) return;

      const { active, over } = event;

      if (over && active.id !== over.id) {
        setItems((prevItems) => {
          const oldIndex = prevItems.findIndex((item) => item.id === active.id);
          const newIndex = prevItems.findIndex((item) => item.id === over.id);
          const newItems = arrayMove(prevItems, oldIndex, newIndex);

          const maxSortIndex = newItems.length - 1;
          const updatedItems = newItems.map((item, index) => ({
            ...item,
            sort_index: maxSortIndex - index,
          })) as T[];

          onSort(updatedItems);

          return updatedItems;
        });
      }
    },
    [disabled, onSort]
  );

  if (!items.length) {
    return (
      <div className="mt-4 p-6 border border-dashed border-zui-silver rounded-md text-center">
        {emptyMessage}
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="mt-4">
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-4">
            {items.map((item, index) =>
              renderItem ? (
                <SortableWrapper key={item.id} id={item.id} disabled={disabled}>
                  {renderItem(item, index)}
                </SortableWrapper>
              ) : (
                <DefaultSortableItem
                  key={item.id}
                  id={item.id}
                  item={item}
                  onDelete={onDelete}
                  disabled={disabled}
                  width={itemWidth}
                  height={itemHeight}
                  showPreview={showPreview}
                  showDelete={showDelete}
                />
              )
            )}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
}

const SortableWrapper: React.FC<SortableWrapperProps> = memo(
  ({ id, disabled = false, children }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
      disabled,
    });

    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }),
      [transform, transition, isDragging]
    );

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          relative group transition-shadow duration-200
          ${isDragging ? "shadow-lg z-10" : "shadow-sm hover:shadow-md"}
          ${
            disabled
              ? "opacity-70 cursor-not-allowed"
              : "cursor-grab active:cursor-grabbing"
          }
        `}
        {...attributes}
        {...listeners}
      >
        {children}
      </div>
    );
  }
);

const DefaultSortableItem: React.FC<DefaultSortableItemProps> = memo(
  ({
    id,
    item,
    onDelete,
    disabled = false,
    width = 120,
    height = 120,
    showPreview = true,
    showDelete = true,
  }) => {
    const [previewVisible, setPreviewVisible] = useState(false);
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
      disabled,
    });

    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }),
      [transform, transition, isDragging]
    );

    const showPreviewHandler = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviewVisible(true);
    }, []);

    const handleDeleteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(id);
      },
      [onDelete, id]
    );

    const handleClosePreview = useCallback(() => {
      setPreviewVisible(false);
    }, []);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
        relative group border border-zui-silver rounded-md overflow-hidden transition-shadow duration-200
        ${isDragging ? "shadow-lg z-10" : "shadow-sm hover:shadow-md"}
        ${
          disabled
            ? "opacity-70 cursor-not-allowed"
            : "cursor-grab active:cursor-grabbing"
        }
      `}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: `${width}px`, height: `${height}px` }}
          {...attributes}
          {...listeners}
        >
          {item.category === "image" ? (
            <Image
              src={item.url}
              alt={item.metadata.alt || "Image"}
              width={width}
              height={height}
              style={{ objectFit: "cover" }}
              preview={false}
              className="pointer-events-none"
              loading="lazy"
            />
          ) : (
            <video
              width={width}
              height={height}
              style={{ objectFit: "cover" }}
              className="pointer-events-none"
              preload="metadata"
            >
              <source src={item.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {/* Action buttons */}
          <div className="absolute top-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {showPreview && (
              <Tooltip title="Preview">
                <Button
                  type="primary"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={showPreviewHandler}
                  className="!flex !items-center !justify-center !bg-zui-dark"
                  disabled={disabled}
                />
              </Tooltip>
            )}
            {showDelete && onDelete && (
              <Tooltip title="Delete">
                <Button
                  type="primary"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteClick}
                  className="!flex !items-center !justify-center"
                  disabled={disabled}
                />
              </Tooltip>
            )}
          </div>
        </div>

        {/* Preview modal */}
        {showPreview && (
          <Modal
            open={previewVisible}
            footer={null}
            onCancel={handleClosePreview}
            centered
            destroyOnClose
          >
            {item.category === "image" ? (
              <img
                src={item.url}
                alt={item.metadata.alt || "Image preview"}
                className="w-full h-96"
              />
            ) : (
              <video controls className="w-full h-96" autoPlay>
                <source src={item.url} type="video/mp4" />
              </video>
            )}
          </Modal>
        )}
      </div>
    );
  }
);

export default memo(SortableGallery);
