import { SaveOutlined, StarOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { isValidString } from "@zo/utils/string";
import { Button, Drawer, message, Typography } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { SpotlightTrip, Trip } from "apps/admin/src/config/typings";
import {
  LivePreview,
  PositionsManagement,
  TripSelection,
} from "../helpers/spotlight-trip-management";

export interface PlaylistTrack {
  relation_id: string;
  playlist: string;
  relation_type: "inventory";
  sort_index: number;
}

export interface SpotlightTripManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const { Text, Title } = Typography;

const MAX_SPOTLIGHT_TRIPS = 4;
const RELATION_TYPE = "inventory" as const;

const SpotlightTripManagement: React.FC<SpotlightTripManagementProps> = ({
  isOpen,
  onClose,
}) => {
  const [form] = useForm();
  const [spotlightPositions, setSpotlightPositions] = useState<string[]>(
    Array(MAX_SPOTLIGHT_TRIPS).fill("")
  );
  const [hasChanges, setHasChanges] = useState(false);

  // API Queries
  const { data: spotlightPlaylistId, isLoading: isLoadingPlaylistId } =
    useQueryApi<string>("CAS_SEED", {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) => data.data?.discover?.home_page?.spotlight?.trips,
      onError: () => message.error("Failed to load playlist configuration"),
    });

  const { data: tripsData, isLoading: isLoadingTrips } = useQueryApi<Trip[]>(
    "CAS_INVENTORY",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) => data.data || [],
      onError: () => message.error("Failed to load trips"),
    },
    "",
    "type=trip&ordering=-status,name&fields=id,name,status=active&limit=-1"
  );

  const { data: currentSpotlightTrips, isLoading: isLoadingSpotlight } =
    useQueryApi<SpotlightTrip[]>("DISCOVER_SPOTLIGHT_TRIPS", {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) => data.data?.inventories || [],
      onError: () => message.error("Failed to load current spotlight trips"),
    });

  const { mutate: addPlaylistTracks, isLoading: isSaving } = useMutationApi(
    "CAS_PLAYTRACKS_BULK_CREATE"
  );

  const { mutate: deletePlaylistTracks, isLoading: isDeletingPlaylistTracks } =
    useMutationApi("CAS_PLAYTRACKS_BULK_DELETE", {}, "", "DELETE");

  const { data: tracks, remove: removeTracks } = useQueryApi(
    "CAS_PLAYTRACKS",
    {
      enabled: isValidString(spotlightPlaylistId),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
      select: (data) => data.data,
    },
    "",
    `playlist=${spotlightPlaylistId}`
  );

  useEffect(() => {
    if (isOpen && tracks) {
      const tracksData = (tracks as any)?.results || tracks;
      if (Array.isArray(tracksData)) {
        const currentTracks = tracksData
          .sort((a: any, b: any) => b.sort_index - a.sort_index)
          .map((track: any) => track.relation_id);

        const positions = Array(MAX_SPOTLIGHT_TRIPS)
          .fill("")
          .map((_, index) => currentTracks[index] || "");

        const nonEmptyTracks = positions.filter((tripId) => tripId !== "");

        setSpotlightPositions(positions);
        try {
          form.setFieldValue("initial_trips", nonEmptyTracks);
        } catch (error) {}
        setHasChanges(false);
      }
    }
  }, [isOpen, tracks, form]);

  const tripOptions = useMemo(
    () =>
      tripsData?.map((trip) => ({ value: trip.id, label: trip.name })) || [],
    [tripsData]
  );

  const spotlightPositionsWithDetails = useMemo(() => {
    return spotlightPositions.map((tripId, index) => {
      let tripDetail = tripsData?.find((trip) => trip.id === tripId);

      if (!tripDetail && tripId && tracks) {
        const tracksData = (tracks as any)?.results || tracks;
        if (Array.isArray(tracksData)) {
          const trackDetail = tracksData.find(
            (track: any) => track.relation_id === tripId
          );
          if (trackDetail?.track_data) {
            tripDetail = {
              id: trackDetail.relation_id,
              name: trackDetail.track_data.title,
            } as Trip;
          }
        }
      }

      if (!tripDetail && tripId) {
        const currentTrip = currentSpotlightTrips?.find(
          (trip) => trip.pid === tripId
        );
        if (currentTrip) {
          tripDetail = { id: currentTrip.pid, name: currentTrip.name } as Trip;
        }
      }

      return {
        position: index,
        tripId,
        tripName: tripDetail?.name || (tripId ? `Trip ${tripId}` : ""),
        isEmpty: !tripId,
      };
    });
  }, [spotlightPositions, tripsData, tracks, currentSpotlightTrips]);

  const hasExistingTracks = useMemo(() => {
    const tracksArray = (tracks as any)?.results || [];
    return Array.isArray(tracksArray) && tracksArray.length > 0;
  }, [tracks]);

  const activePositions = useMemo(() => {
    return spotlightPositionsWithDetails.filter((item) => !item.isEmpty);
  }, [spotlightPositionsWithDetails]);

  const filledPositionsCount = activePositions.length;

  const handleRemovePosition = useCallback(
    (position: number) => {
      const nonEmptyTrips = spotlightPositions.filter(
        (tripId) => tripId !== ""
      );
      const tripToRemove = nonEmptyTrips[position];
      const actualPosition = spotlightPositions.indexOf(tripToRemove);

      const newPositions = [...spotlightPositions];
      newPositions[actualPosition] = "";

      const remainingTrips = newPositions.filter((tripId) => tripId !== "");
      try {
        form.setFieldValue("initial_trips", remainingTrips);
      } catch (error) {}

      setSpotlightPositions(newPositions);
      setHasChanges(true);
    },
    [spotlightPositions, form]
  );

  const handlePositionsReorder = useCallback(
    (reorderedTripIds: string[]) => {
      const newPositions = Array(MAX_SPOTLIGHT_TRIPS)
        .fill("")
        .map((_, index) => reorderedTripIds[index] || "");

      setSpotlightPositions(newPositions);
      try {
        form.setFieldValue("initial_trips", reorderedTripIds);
      } catch (error) {}
      setHasChanges(true);
    },
    [spotlightPositions, form]
  );

  const handleRemoveAll = useCallback(() => {
    setSpotlightPositions(Array(MAX_SPOTLIGHT_TRIPS).fill(""));
    try {
      form.setFieldValue("initial_trips", []);
    } catch (error) {}
    setHasChanges(true);
  }, [form]);

  const handleTripSelection = useCallback(
    (selectedTripIds: string[]) => {
      const uniqueSelectedIds = [...new Set(selectedTripIds)];

      const currentTrips = spotlightPositions.filter((tripId) => tripId !== "");

      const mergedTrips = [...currentTrips];
      uniqueSelectedIds.forEach((tripId) => {
        if (!mergedTrips.includes(tripId)) {
          mergedTrips.push(tripId);
        }
      });

      const limitedTripIds = mergedTrips.slice(0, MAX_SPOTLIGHT_TRIPS);

      if (mergedTrips.length > MAX_SPOTLIGHT_TRIPS) {
        try {
          form.setFieldValue("initial_trips", limitedTripIds);
        } catch (error) {}
        message.warning(`Maximum ${MAX_SPOTLIGHT_TRIPS} trips allowed`);
      }

      const newPositions = Array(MAX_SPOTLIGHT_TRIPS)
        .fill("")
        .map((_, index) => limitedTripIds[index] || "");

      setSpotlightPositions(newPositions);
      setHasChanges(true);
    },
    [form, spotlightPositions]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    const tripsToSave = spotlightPositions.filter((tripId) => tripId !== "");

    if (!spotlightPlaylistId) {
      message.error("Playlist configuration not available");
      return;
    }

    const deleteExistingTracks = () => {
      return new Promise<void>((resolve, reject) => {
        const tracksArray = (tracks as any)?.results || tracks || [];
        if (!Array.isArray(tracksArray) || tracksArray.length === 0) {
          resolve();
          return;
        }

        const trackIdsToDelete = tracksArray.map((track: any) => track.id);

        deletePlaylistTracks(
          { data: trackIdsToDelete },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });
    };

    const createNewTracks = () => {
      return new Promise<void>((resolve, reject) => {
        if (tripsToSave.length === 0) {
          resolve();
          return;
        }

        const tracksData: PlaylistTrack[] = tripsToSave.map(
          (tripId, index) => ({
            relation_id: tripId,
            playlist: spotlightPlaylistId,
            relation_type: RELATION_TYPE,
            sort_index: tripsToSave.length - index,
          })
        );

        addPlaylistTracks(
          { data: tracksData },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });
    };

    try {
      await deleteExistingTracks();
      await createNewTracks();
      removeTracks();

      message.success(
        `${tripsToSave.length} spotlight trips saved successfully`
      );
      setHasChanges(false);
      onClose();
    } catch (error) {
      message.error("Failed to update spotlight trips");
    }
  }, [
    spotlightPlaylistId,
    spotlightPositions,
    tracks,
    addPlaylistTracks,
    deletePlaylistTracks,
    removeTracks,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    setHasChanges(false);
    setSpotlightPositions(Array(MAX_SPOTLIGHT_TRIPS).fill(""));
    try {
      form.setFieldValue("initial_trips", []);
    } catch (error) {}
    onClose();
  }, [onClose, form]);

  const isLoading = isLoadingTrips || isLoadingSpotlight || isLoadingPlaylistId;
  const isSavingComplete = isSaving || isDeletingPlaylistTracks;

  return (
    <Drawer
      title={
        <div className="flex items-center space-x-2">
          <StarOutlined className="text-zui-neon" />
          <span>Manage Spotlight Trips</span>
        </div>
      }
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={700}
      className="dark-drawer"
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={isSavingComplete}
          disabled={!hasChanges || isLoading}
          className="bg-zui-neon text-zui-dark hover:bg-zui-neon/80"
        >
          Save Changes
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Header Summary */}

        <div className="bg-zui-dark/30 p-4 rounded-lg border border-zui-silver/20">
          <div className="flex justify-between items-center">
            <div>
              <Text className="text-zui-white font-medium text-base">
                Spotlight Trip Management
              </Text>
              <br />
              <Text className="text-sm text-zui-silver">
                Manage up to {MAX_SPOTLIGHT_TRIPS} featured trips in spotlight
                section
              </Text>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-zui-neon">
                {filledPositionsCount}/{MAX_SPOTLIGHT_TRIPS}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Selection Section */}
        {(!hasExistingTracks || filledPositionsCount < MAX_SPOTLIGHT_TRIPS) && (
          <TripSelection
            form={form}
            tripOptions={tripOptions}
            isLoadingTrips={isLoadingTrips}
            onTripSelection={handleTripSelection}
            maxSpotlightTrips={MAX_SPOTLIGHT_TRIPS}
            hasExistingTracks={hasExistingTracks}
            filledPositionsCount={filledPositionsCount}
          />
        )}

        {/* Spotlight Positions Management */}
        {(hasExistingTracks || filledPositionsCount > 0) && (
          <PositionsManagement
            activePositions={activePositions}
            filledPositionsCount={filledPositionsCount}
            onPositionsReorder={handlePositionsReorder}
            onRemovePosition={handleRemovePosition}
            onRemoveAll={handleRemoveAll}
            isSavingComplete={isSavingComplete}
          />
        )}

        {/* Empty State */}
        {!hasExistingTracks && filledPositionsCount === 0 && (
          <div className="text-center py-12 bg-zui-dark/20 rounded-lg border-2 border-dashed border-zui-silver/30">
            <div className="text-6xl mb-4">🌟</div>
            <Title level={3} className="text-zui-silver mb-2">
              No Spotlight Trips Set
            </Title>
            <Text className="text-zui-silver">
              Select trips from the dropdown above to get started
            </Text>
          </div>
        )}

        {/* Live Preview */}
        <LivePreview
          currentSpotlightTrips={currentSpotlightTrips || []}
          maxSpotlightTrips={MAX_SPOTLIGHT_TRIPS}
        />
      </div>
    </Drawer>
  );
};

export default SpotlightTripManagement;
