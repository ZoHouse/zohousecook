import { DeleteOutlined, DragOutlined } from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { Button, Card, Flex, Typography, message } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useState } from "react";
import { Destination } from "../../../config";
import { AddTripDestinationSidebar } from "../../sidebars";
import { PageHeader } from "../../ui2";

interface TripDestinationsProps {
  destinations: Destination[];
  tripId: string;
  refetch: () => void;
}

const SortableCard = ({
  destination,
  onDelete,
}: {
  destination: Destination;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({
    id: destination.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="shadow-sm hover:shadow-md transition-shadow mb-2 z-20"
      styles={{ body: { padding: "16px" } }}
    >
      <Flex vertical gap="small">
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="small">
            {/* Drag handle only */}
            <DragOutlined
              ref={setActivatorNodeRef}
              {...listeners}
              {...attributes}
              className="cursor-move text-gray-500 hover:text-gray-700"
            />
            <Typography.Text strong>{destination.name}</Typography.Text>
          </Flex>

          {/* Delete button */}
          <DeleteOutlined
            onClick={() => onDelete(destination.id)}
            className="cursor-pointer text-red-500 hover:text-red-600"
          />
        </Flex>

        <Flex
          align="center"
          gap="small"
          justify="space-between"
          className="text-zui-silver"
        >
          <Typography.Text type="secondary">
            {destination.country.name} ({destination.country.code})
          </Typography.Text>
          <Typography.Text type="secondary" className="text-sm">
            Code: {destination.code}
          </Typography.Text>
        </Flex>
      </Flex>
    </Card>
  );
};

const TripDestinations: React.FC<TripDestinationsProps> = ({
  destinations,
  tripId,
  refetch,
}) => {
  const [form] = useForm();
  const [destinationList, setDestinationList] = useState(destinations);
  const [
    isAddTripDestinationVisible,
    showAddTripDestination,
    hideAddTripDestination,
  ] = useVisibilityState();

  useEffect(() => {
    setDestinationList(destinations);
  }, [destinations]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { mutate: updateDestinations } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "POST"
  );

  const handleClose = () => {
    hideAddTripDestination();
    form.resetFields();
  };

  /** Delete destination */
  const handleDeleteDestination = useCallback(
    (id: string) => {
      const newList = destinationList.filter((d) => d.id !== id);
      setDestinationList(newList);

      updateDestinations(
        {
          data: {
            destinations: newList.map((destination, index) => ({
              id: destination.id,
              sort_index: newList.length - index,
            })),
          },
          route: `${tripId}/destinations/`,
        },
        {
          onSuccess() {
            message.success("Destination deleted!");
            refetch();
          },
          onError(error) {
            setDestinationList(destinationList);
            message.error(processResponseError(error));
          },
        }
      );
    },
    [destinationList, tripId, refetch, updateDestinations]
  );

  /** Reordering */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = destinationList.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = destinationList.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(destinationList, oldIndex, newIndex);

      setDestinationList(newItems);

      const _body = newItems.map((destination, index) => ({
        id: destination.id,
        sort_index: newItems.length - index,
      }));

      updateDestinations(
        {
          data: {
            destinations: _body,
          },
          route: `${tripId}/destinations/`,
        },
        {
          onSuccess() {
            message.success("Destinations reordered!");
            refetch();
          },
          onError(error) {
            setDestinationList(destinationList);
            message.error(processResponseError(error));
          },
        }
      );
    },
    [destinationList, tripId, refetch, updateDestinations]
  );

  return (
    <>
      <PageHeader
        title="Trip Destinations"
        rightOptions={
          <Button type="primary" onClick={showAddTripDestination}>
            Add Destination
          </Button>
        }
      />

      <Flex vertical gap="middle" className="p-4">
        <div className="w-full md:w-[320px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1">
              <SortableContext
                items={destinationList.map((d) => d.id)}
                strategy={rectSortingStrategy}
              >
                {destinationList.map((destination) => (
                  <SortableCard
                    key={destination.id}
                    destination={destination}
                    onDelete={handleDeleteDestination}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </Flex>

      <AddTripDestinationSidebar
        open={isAddTripDestinationVisible}
        onClose={handleClose}
        destinations={destinations}
        tripId={tripId}
        refetch={refetch}
      />
    </>
  );
};

export default TripDestinations;
