import { SaveOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { Button, Drawer, Spin } from "antd";
import React, { useMemo, useState } from "react";
import { FeaturedTag } from "../../config/typings";
import TripOrderControls from "../helpers/trips/TripOrderControls";
import TripOrderList from "../helpers/trips/TripOrderList";
import { useTripOrderManagement } from "../helpers/trips/useTripOrderManagement";

interface TripOrderManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const TripOrderManagement: React.FC<TripOrderManagementProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const { data: featuredTags, isLoading: isLoadingFeaturedTags } = useQueryApi<
    FeaturedTag[]
  >(
    "CAS_FEATURED_TAGS",
    {
      enabled: isOpen,
      select(data) {
        return data?.data?.results || [];
      },
      retry: 1,
    },
    "",
    ""
  );

  const {
    trips,
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
  } = useTripOrderManagement({ isOpen, onClose });

  const hasChanges = changedTripIds.size > 0;

  const filteredTrips = useMemo(
    () =>
      selectedSlug
        ? trips.filter((trip) => trip.tags?.includes(selectedSlug))
        : trips,
    [trips, selectedSlug]
  );

  return (
    <Drawer
      title="Manage Trip Dropdown"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={520}
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={isUpdating}
          disabled={!hasChanges}
        >
          Save Order ({changedTripIds.size} changes)
        </Button>
      }
    >
      <div className="space-y-4">
        <TripOrderControls
          onAutoFillAscending={handleAutoFillAscending}
          onAutoFillDescending={handleAutoFillDescending}
          editingTripIds={editingTripIds}
          changedTripIds={changedTripIds}
        />

        <div className="flex flex-wrap gap-2">
          {isLoadingFeaturedTags ? (
            <Spin size="small" />
          ) : featuredTags && featuredTags.length > 0 ? (
            featuredTags.map((tag) => (
              <Button
                key={tag.id}
                type={selectedSlug === tag.tag.slug ? "primary" : "default"}
                onClick={() =>
                  setSelectedSlug(
                    selectedSlug === tag.tag.slug ? null : tag.tag.slug
                  )
                }
                className="flex items-center gap-1"
              >
                <span>{tag.tag.emoji}</span>
                <span>{tag.tag.label}</span>
              </Button>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No featured tags found</p>
          )}
        </div>

        <TripOrderList
          trips={filteredTrips}
          isLoading={isLoading}
          onDragEnd={handleDragEnd}
          onSortIndexChange={handleSortIndexChange}
          changedTripIds={changedTripIds}
          editingTripIds={editingTripIds}
          onToggleEdit={handleToggleEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
        />
      </div>
    </Drawer>
  );
};

export default TripOrderManagement;
