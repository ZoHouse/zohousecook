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
import { Spin, Typography } from "antd";
import React from "react";
import SortableTripItem from "./SortableTripItem";

const { Title } = Typography;

interface TripOrderListProps {
  trips: GeneralObject[];
  isLoading: boolean;
  onDragEnd: (event: any) => void;
  onSortIndexChange: (tripId: string, newSortIndex: number) => void;
  changedTripIds: Set<string>;
  editingTripIds: Set<string>;
  onToggleEdit: (tripId: string) => void;
  onSaveEdit: (tripId: string) => void;
  onCancelEdit: (tripId: string) => void;
}

const TripOrderList: React.FC<TripOrderListProps> = ({
  trips,
  isLoading,
  onDragEnd,
  onSortIndexChange,
  changedTripIds,
  editingTripIds,
  onToggleEdit,
  onSaveEdit,
  onCancelEdit,
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
    <div>
      <Title level={5} className="mb-3">
        Header Dropdown Order ({trips.length} active trips)
      </Title>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-8 text-zui-silver">
          No active trips found
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={trips.map((trip) => trip.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {trips.map((trip, index) => (
                <SortableTripItem
                  key={trip.id}
                  trip={trip}
                  index={index}
                  onSortIndexChange={onSortIndexChange}
                  hasChanged={changedTripIds.has(trip.id)}
                  isEditing={editingTripIds.has(trip.id)}
                  onToggleEdit={onToggleEdit}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default TripOrderList;
