import { DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Card, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface SpotlightPositionProps {
  position: number;
  tripId: string;
  tripName?: string;
  onRemove: (position: number) => void;
  isSaving: boolean;
}

const SpotlightPosition: React.FC<SpotlightPositionProps> = ({
  position,
  tripId,
  tripName,
  onRemove,
  isSaving,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `position-${position}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="w-full bg-zui-light border-zui-silver/20 hover:border-zui-neon/50 transition-all duration-200 mb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing flex items-center justify-center p-2 hover:bg-zui-dark/50 rounded transition-colors"
            >
              <HolderOutlined className="text-zui-silver hover:text-zui-neon" />
            </div>
            <div className="flex items-center justify-center w-10 h-10 bg-zui-neon text-zui-dark rounded-full font-bold text-sm">
              {position + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Text strong className="text-zui-white text-base">
                  {tripName}
                </Text>
                <span className="px-3 py-1 bg-zui-neon/20 text-zui-neon text-xs rounded-full font-medium border border-zui-neon/30">
                  Spotlight
                </span>
              </div>
            </div>
          </div>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemove(position)}
            disabled={isSaving}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-0"
          >
            Remove
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SpotlightPosition;
