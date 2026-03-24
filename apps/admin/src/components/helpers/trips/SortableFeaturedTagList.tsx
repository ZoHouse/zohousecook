import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GeneralObject } from "@zo/definitions/general";
import { Button, Spin, Typography } from "antd";
import React from "react";
import SortableFeaturedTagItem from "./SortableFeaturedTagItem";

const { Title } = Typography;

interface SortableFeaturedTagListProps {
  tags: GeneralObject[];
  isLoading: boolean;
  onDragEnd: (event: any) => void;
  onSortIndexChange: (tagId: string, newSortIndex: number) => void;
  changedTagIds: Set<string>;
  editingTagIds: Set<string>;
  onToggleEdit: (tagId: string) => void;
  onSaveEdit: (tagId: string) => void;
  onCancelEdit: (tagId: string) => void;
  onDelete: (tagId: string) => void;
  onAutoFillAscending: () => void;
  onAutoFillDescending: () => void;
}

const SortableFeaturedTagList: React.FC<SortableFeaturedTagListProps> = ({
  tags,
  isLoading,
  onDragEnd,
  onSortIndexChange,
  changedTagIds,
  editingTagIds,
  onToggleEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onAutoFillAscending,
  onAutoFillDescending,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={5} className="!mb-0">
          Featured Tags Order ({tags.length} tags)
        </Title>
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={onAutoFillAscending}
            title="Auto-fill ascending order"
            disabled={isLoading}
          >
            Ascending
          </Button>
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={onAutoFillDescending}
            title="Auto-fill descending order"
            disabled={isLoading}
          >
            Descending
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8 text-zui-silver">
          No featured tags found
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={tags.map((tag) => tag.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tags.map((tag, index) => (
                <SortableFeaturedTagItem
                  key={tag.id}
                  tag={tag}
                  index={index}
                  onSortIndexChange={onSortIndexChange}
                  hasChanged={changedTagIds.has(tag.id)}
                  isEditing={editingTagIds.has(tag.id)}
                  onToggleEdit={onToggleEdit}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default SortableFeaturedTagList;
