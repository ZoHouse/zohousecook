import { SaveOutlined } from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { Button, Drawer, message, Typography } from "antd";
import React, { useState } from "react";
import { AddTripFeaturedTagSidebar } from ".";
import SortableFeaturedTagList from "../helpers/trips/SortableFeaturedTagList";
import { useFeaturedTagsManagement } from "../helpers/trips/useFeaturedTagsManagement";

export interface TripFeaturedTagsProps {
  isOpen: boolean;
  onClose: () => void;
}

const { Text } = Typography;

const TripFeaturedTags: React.FC<TripFeaturedTagsProps> = ({
  isOpen,
  onClose,
}) => {
  const [featuredTags, setFeaturedTags] = useState<GeneralObject[]>([]);

  const [
    isFeaturedTagSidebarVisible,
    showFeaturedTagSidebar,
    hideFeaturedTagSidebar,
  ] = useVisibilityState();

  const { refetch, isLoading } = useInfiniteTable({
    setter: setFeaturedTags,
    queryEndpoint: "CAS_FEATURED_TAGS",
    name: "featured-tags",
    enabled: isOpen,
    customSearchQuery: `ordering=-sort_index`,
  });

  const { mutate: deleteFeaturedTag } = useMutationApi(
    "CAS_FEATURED_TAGS",
    {},
    "",
    "DELETE"
  );

  const handleDelete = async (id: string) => {
    deleteFeaturedTag(
      { data: {}, route: `${id}/` },
      {
        onSuccess: () => {
          message.success("Featured tag deleted successfully");
          refetch();
        },
        onError: (error) => {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const {
    tags: sortableTags,
    isUpdating,
    changedTagIds,
    editingTagIds,
    handleAutoFillAscending,
    handleAutoFillDescending,
    handleDragEnd,
    handleSortIndexChange,
    handleToggleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleSave,
  } = useFeaturedTagsManagement({
    tags: featuredTags,
    isLoading,
    refetch,
  });

  const hasChanges = changedTagIds.size > 0;

  return (
    <Drawer
      title="Featured Tags"
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={600}
      className="dark-drawer"
      extra={
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={showFeaturedTagSidebar}
            className="bg-zui-neon text-zui-dark hover:bg-zui-neon/80"
          >
            Add
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={isUpdating}
            disabled={!hasChanges}
            className="bg-zui-neon text-zui-dark hover:bg-zui-neon/80"
          >
            Save Order
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-zui-light p-3">
          <Text className="text-sm text-zui-silver">
            Drag and drop to reorder how active tags appear in the website
            header dropdown, or click ✏️ Edit to manually change sort index
            values. Higher sort index values appear first in the dropdown.
          </Text>
        </div>

        <SortableFeaturedTagList
          tags={sortableTags}
          isLoading={isLoading}
          onDragEnd={handleDragEnd}
          onSortIndexChange={handleSortIndexChange}
          changedTagIds={changedTagIds}
          editingTagIds={editingTagIds}
          onToggleEdit={handleToggleEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDelete}
          onAutoFillAscending={handleAutoFillAscending}
          onAutoFillDescending={handleAutoFillDescending}
        />

        <AddTripFeaturedTagSidebar
          isOpen={isFeaturedTagSidebarVisible}
          onClose={hideFeaturedTagSidebar}
          refetch={refetch}
        />
      </div>
    </Drawer>
  );
};

export default TripFeaturedTags;
