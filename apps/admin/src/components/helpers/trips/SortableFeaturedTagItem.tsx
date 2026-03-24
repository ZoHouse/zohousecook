import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GeneralObject } from "@zo/definitions/general";
import { Button, Card, InputNumber, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface SortableFeaturedTagItemProps {
  tag: GeneralObject;
  index: number;
  onSortIndexChange: (tagId: string, newSortIndex: number) => void;
  hasChanged: boolean;
  isEditing: boolean;
  onToggleEdit: (tagId: string) => void;
  onSaveEdit: (tagId: string) => void;
  onCancelEdit: (tagId: string) => void;
  onDelete: (tagId: string) => void;
}

const SortableFeaturedTagItem: React.FC<SortableFeaturedTagItemProps> = ({
  tag,
  index,
  onSortIndexChange,
  hasChanged,
  isEditing,
  onToggleEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tag.id,
    transition: {
      duration: 150,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        className={`mb-2 cursor-move ${isDragging ? " border-zui-white" : ""} ${
          hasChanged ? "border-zui-neon bg-zui-dark" : ""
        } ${isEditing ? "border-zui-neon bg-zui-dark" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-move text-zui-silver hover:text-zui-white p-1"
            >
              <DragOutlined className="text-lg" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <Text strong className="text-sm">
                  {tag.tag?.label}
                </Text>
                <Text className="text-sm text-zui-silver">
                  {tag.tag?.emoji}
                </Text>
              </div>
              <Text className="text-xs text-zui-silver">
                Tag: {tag.tag?.slug}
              </Text>
              {hasChanged && (
                <Text className="text-xs text-zui-neon">
                  ● Changed - will be updated
                </Text>
              )}
              {isEditing && (
                <Text className="text-xs text-zui-neon">
                  ✏️ Editing mode - change sort index
                </Text>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex gap-1">
                <Button
                  icon={<CheckOutlined />}
                  onClick={() => onSaveEdit(tag.id)}
                  size="small"
                  type="primary"
                  className="bg-zui-neon border-zui-neon"
                  title="Save changes and reorder"
                />
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => onCancelEdit(tag.id)}
                  size="small"
                  type="default"
                  title="Cancel editing"
                />
              </div>
            ) : (
              <Button
                icon={<EditOutlined />}
                onClick={() => onToggleEdit(tag.id)}
                size="small"
                type="default"
                title="Edit sort index"
              />
            )}
            <div className="flex flex-col items-end gap-1">
              <Text className="text-xs text-zui-silver">Sort Index</Text>
              <InputNumber
                size="small"
                value={tag.sort_index}
                onChange={(value) => onSortIndexChange(tag.id, value || 0)}
                className={`w-16 ${hasChanged ? "border-zui-neon" : ""}`}
                min={0}
                disabled={!isEditing}
                placeholder={isEditing ? "Enter value" : "Read only"}
              />
            </div>
            <div className="text-xs text-zui-silver bg-zui-light px-2 py-1">
              #{index + 1}
            </div>
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onDelete(tag.id)}
              title="Delete featured tag"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SortableFeaturedTagItem;
