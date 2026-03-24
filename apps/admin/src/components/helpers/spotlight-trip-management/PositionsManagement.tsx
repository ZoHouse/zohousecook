import {
  closestCenter,
  DndContext,
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
import { Button, Card, Typography } from "antd";
import React from "react";
import SpotlightPosition from "./SpotlightPosition";

const { Title, Text } = Typography;

interface PositionsManagementProps {
  activePositions: Array<{
    position: number;
    tripId: string;
    tripName: string;
    isEmpty: boolean;
  }>;
  filledPositionsCount: number;
  onPositionsReorder: (newPositions: string[]) => void;
  onRemovePosition: (position: number) => void;
  onRemoveAll: () => void;
  isSavingComplete: boolean;
}

const PositionsManagement: React.FC<PositionsManagementProps> = ({
  activePositions,
  filledPositionsCount,
  onPositionsReorder,
  onRemovePosition,
  onRemoveAll,
  isSavingComplete,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeIndex = parseInt(
        active.id.toString().replace("position-", "")
      );
      const overIndex = parseInt(over.id.toString().replace("position-", ""));

      const currentTripIds = activePositions.map((item) => item.tripId);

      const reorderedTripIds = arrayMove(
        currentTripIds,
        activeIndex,
        overIndex
      );

      const movedTripId = currentTripIds[activeIndex];
      const movedTripName = activePositions[activeIndex]?.tripName || "Unknown";

      onPositionsReorder(reorderedTripIds);
    }
  };

  return (
    <Card className="bg-zui-dark border-zui-silver/20">
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="text-zui-neon mb-0 flex items-center">
          Spotlight Positions
        </Title>
        {filledPositionsCount > 0 && (
          <Button
            danger
            size="small"
            onClick={onRemoveAll}
            disabled={isSavingComplete}
            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
          >
            Clear All
          </Button>
        )}
      </div>

      {filledPositionsCount > 0 ? (
        <>
          <div className="mb-4 p-3 bg-zui-neon/5 border border-zui-neon/20 rounded-lg">
            <Text className="text-sm text-zui-silver">
              💡 Drag and drop to reorder positions. Higher positions get more
              visibility.
            </Text>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activePositions.map((_, index) => `position-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0">
                {activePositions.map((item) => (
                  <SpotlightPosition
                    key={`position-${item.position}`}
                    position={item.position}
                    tripId={item.tripId}
                    tripName={item.tripName}
                    onRemove={onRemovePosition}
                    isSaving={isSavingComplete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-zui-silver/30 rounded-lg">
          <Text className="text-zui-silver">
            No trips selected for spotlight positions
          </Text>
        </div>
      )}
    </Card>
  );
};

export default PositionsManagement;
