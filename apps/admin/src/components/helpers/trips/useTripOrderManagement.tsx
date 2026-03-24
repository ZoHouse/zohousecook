import { arrayMove } from "@dnd-kit/sortable";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "react-query";

interface UseTripOrderManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const useTripOrderManagement = ({
  isOpen,
  onClose,
}: UseTripOrderManagementProps) => {
  const queryClient = useQueryClient();
  const [trips, setTrips] = useState<GeneralObject[]>([]);
  const [originalTrips, setOriginalTrips] = useState<GeneralObject[]>([]);
  const [changedTripIds, setChangedTripIds] = useState<Set<string>>(new Set());
  const [editingTripIds, setEditingTripIds] = useState<Set<string>>(new Set());
  const [tempSortValues, setTempSortValues] = useState<Map<string, number>>(
    new Map()
  );

  // Fetch all trips for ordering
  const { data: tripsData, isLoading } = useQueryApi<GeneralObject[]>(
    "CAS_INVENTORY",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    "",
    "type=trip&status=active&ordering=-sort_index,name&fields=id,name,tags,sort_index&limit=-1"
  );

  // Mutation for updating trip order
  const { mutate: updateTripOrder, isLoading: isUpdating } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "PATCH"
  );

  useEffect(() => {
    if (tripsData) {
      setTrips(tripsData);
      setOriginalTrips(tripsData);
      setChangedTripIds(new Set());
      setEditingTripIds(new Set());
      setTempSortValues(new Map());
    }
  }, [tripsData]);

  // Track which trips have changed
  const updateChangedTrips = useCallback(
    (updatedTrips: GeneralObject[]) => {
      const changed = new Set<string>();
      updatedTrips.forEach((trip) => {
        const original = originalTrips.find((orig) => orig.id === trip.id);
        if (original && original.sort_index !== trip.sort_index) {
          changed.add(trip.id);
        }
      });
      setChangedTripIds(changed);
    },
    [originalTrips]
  );

  // Auto-fill ascending order
  const handleAutoFillAscending = useCallback(() => {
    setTrips((prevTrips) => {
      const updatedTrips = prevTrips.map((trip, index) => ({
        ...trip,
        sort_index: index + 1,
      }));
      updateChangedTrips(updatedTrips);
      return updatedTrips;
    });
  }, [updateChangedTrips]);

  // Auto-fill descending order (highest to lowest)
  const handleAutoFillDescending = useCallback(() => {
    setTrips((prevTrips) => {
      const updatedTrips = prevTrips.map((trip, index) => ({
        ...trip,
        sort_index: prevTrips.length - index,
      }));
      updateChangedTrips(updatedTrips);
      return updatedTrips;
    });
  }, [updateChangedTrips]);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      setTrips((prevTrips) => {
        const oldIndex = prevTrips.findIndex((trip) => trip.id === active.id);
        const newIndex = prevTrips.findIndex((trip) => trip.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prevTrips;

        const newTrips = arrayMove(prevTrips, oldIndex, newIndex);

        // Update sort_index values based on new positions
        const updatedTrips = newTrips.map((trip, index) => ({
          ...trip,
          sort_index: newTrips.length - index,
        }));

        updateChangedTrips(updatedTrips);
        return updatedTrips;
      });
    },
    [updateChangedTrips]
  );

  const handleSortIndexChange = useCallback(
    (tripId: string, newSortIndex: number) => {
      // Only store temp value, don't apply changes until save
      setTempSortValues((prev) => new Map(prev).set(tripId, newSortIndex));
    },
    []
  );

  const handleToggleEdit = useCallback(
    (tripId: string) => {
      setEditingTripIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tripId)) {
          newSet.delete(tripId);
        } else {
          newSet.add(tripId);
          // Store current value as temp value
          const trip = trips.find((t) => t.id === tripId);
          if (trip) {
            setTempSortValues((prev) =>
              new Map(prev).set(tripId, trip.sort_index || 0)
            );
          }
        }
        return newSet;
      });
    },
    [trips]
  );

  const handleSaveEdit = useCallback(
    (tripId: string) => {
      const newSortIndex = tempSortValues.get(tripId);
      if (newSortIndex === undefined) return;

      setTrips((prevTrips) => {
        // Find the trip being edited and its original sort_index
        const editingTrip = prevTrips.find((trip) => trip.id === tripId);
        const originalSortIndex = editingTrip?.sort_index || 0;

        // Check if the new sort_index conflicts with any existing trip
        const conflictingTrip = prevTrips.find(
          (trip) => trip.id !== tripId && trip.sort_index === newSortIndex
        );

        let updatedTrips = [...prevTrips];

        if (conflictingTrip) {
          // Shift the conflicting trip down by 1
          const newConflictSortIndex = newSortIndex - 1;
          updatedTrips = updatedTrips.map((trip) => {
            if (trip.id === conflictingTrip.id) {
              return { ...trip, sort_index: Math.max(0, newConflictSortIndex) };
            }
            return trip;
          });

          let cascadeCheck = true;
          let currentCheckIndex = newConflictSortIndex;
          let shiftedTripIds = new Set([conflictingTrip.id]);

          while (cascadeCheck && currentCheckIndex >= 0) {
            const nextConflict = updatedTrips.find(
              (trip) =>
                trip.id !== tripId &&
                !shiftedTripIds.has(trip.id) &&
                trip.sort_index === currentCheckIndex
            );

            if (nextConflict) {
              const nextNewIndex = currentCheckIndex - 1;

              updatedTrips = updatedTrips.map((trip) => {
                if (trip.id === nextConflict.id) {
                  return { ...trip, sort_index: Math.max(0, nextNewIndex) };
                }
                return trip;
              });

              shiftedTripIds.add(nextConflict.id);
              currentCheckIndex = nextNewIndex;
            } else {
              cascadeCheck = false;
            }
          }
        }

        // Apply the new sort_index to the edited trip
        updatedTrips = updatedTrips.map((trip) =>
          trip.id === tripId ? { ...trip, sort_index: newSortIndex } : trip
        );

        // Sort the entire list after resolving conflicts
        const sortedTrips = updatedTrips.sort(
          (a, b) => (b.sort_index || 0) - (a.sort_index || 0)
        );

        updateChangedTrips(sortedTrips);
        return sortedTrips;
      });

      // Exit edit mode
      setEditingTripIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });

      // Clear temp value
      setTempSortValues((prev) => {
        const newMap = new Map(prev);
        newMap.delete(tripId);
        return newMap;
      });
    },
    [tempSortValues, updateChangedTrips]
  );

  const handleCancelEdit = useCallback((tripId: string) => {
    // Exit edit mode without saving
    setEditingTripIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(tripId);
      return newSet;
    });

    // Clear temp value
    setTempSortValues((prev) => {
      const newMap = new Map(prev);
      newMap.delete(tripId);
      return newMap;
    });
  }, []);

  // Update the trips display to show temp values during editing
  const displayTrips = trips.map((trip) => {
    const tempValue = tempSortValues.get(trip.id);
    return tempValue !== undefined ? { ...trip, sort_index: tempValue } : trip;
  });

  const handleSave = useCallback(async () => {
    if (changedTripIds.size === 0) {
      message.info("No changes to save");
      return;
    }

    try {
      const tripsToUpdate = trips.filter((trip) => changedTripIds.has(trip.id));

      let successCount = 0;
      let failureCount = 0;
      let hasShownSuccess = false;

      const updatePromises = tripsToUpdate.map((trip, index) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            failureCount++;
            reject(new Error(`Timeout updating trip ${trip.name}`));
          }, 5000);

          updateTripOrder(
            {
              data: { sort_index: trip.sort_index || 0 },
              route: `${trip.id}/`,
            },
            {
              onSuccess: (response) => {
                clearTimeout(timeoutId);
                successCount++;

                if (!hasShownSuccess && successCount === 1) {
                  hasShownSuccess = true;
                  message.success(`Trip order updated successfully!`);
                  setChangedTripIds(new Set());
                  setOriginalTrips(trips);

                  queryClient.invalidateQueries({
                    queryKey: ["cas", "inventory"],
                  });

                  onClose();
                }

                resolve({ trip: trip.name, success: true });
              },
              onError: (error) => {
                clearTimeout(timeoutId);
                failureCount++;
                reject({ trip: trip.name, error });
              },
            }
          );
        });
      });

      Promise.allSettled(updatePromises).then((results) => {
        const finalSuccessCount = results.filter(
          (r) => r.status === "fulfilled"
        ).length;

        if (finalSuccessCount === 0 && !hasShownSuccess) {
          message.error("No trips were updated. Please try again.");
        }
      });
    } catch (error) {
      message.error(
        processResponseError(error) || "Failed to update dropdown order"
      );
    }
  }, [
    trips,
    changedTripIds,
    originalTrips,
    updateTripOrder,
    onClose,
    queryClient,
  ]);

  const handleClose = useCallback(() => {
    if (changedTripIds.size > 0) {
      setTrips(originalTrips);
      setChangedTripIds(new Set());
    }
    onClose();
  }, [changedTripIds, originalTrips, onClose]);

  return {
    trips: displayTrips,
    isLoading,
    isUpdating,
    changedTripIds,
    editingTripIds,
    handleAutoFillAscending,
    handleAutoFillDescending,
    handleDragEnd,
    handleSortIndexChange,
    handleToggleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleSave,
    handleClose,
  };
};
