import { arrayMove } from "@dnd-kit/sortable";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";

interface UseFeaturedTagsManagementProps {
  tags: GeneralObject[];
  isLoading: boolean;
  refetch: () => void;
}

export const useFeaturedTagsManagement = ({
  tags,
  isLoading,
  refetch,
}: UseFeaturedTagsManagementProps) => {
  const [featuredTags, setFeaturedTags] = useState<GeneralObject[]>([]);
  const [originalTags, setOriginalTags] = useState<GeneralObject[]>([]);
  const [changedTagIds, setChangedTagIds] = useState<Set<string>>(new Set());
  const [editingTagIds, setEditingTagIds] = useState<Set<string>>(new Set());
  const [tempSortValues, setTempSortValues] = useState<Map<string, number>>(
    new Map()
  );

  // Mutation for updating tag order
  const { mutate: updateTagOrder, isLoading: isUpdating } = useMutationApi(
    "CAS_FEATURED_TAGS",
    {},
    "",
    "PUT"
  );

  useEffect(() => {
    if (tags) {
      setFeaturedTags(tags);
      setOriginalTags(tags);
      setChangedTagIds(new Set());
      setEditingTagIds(new Set());
      setTempSortValues(new Map());
    }
  }, [tags]);

  // Track which tags have changed
  const updateChangedTags = useCallback(
    (updatedTags: GeneralObject[]) => {
      const changed = new Set<string>();
      updatedTags.forEach((tag) => {
        const original = originalTags.find((orig) => orig.id === tag.id);
        if (original && original.sort_index !== tag.sort_index) {
          changed.add(tag.id);
        }
      });
      setChangedTagIds(changed);
    },
    [originalTags]
  );

  // Auto-fill ascending order
  const handleAutoFillAscending = useCallback(() => {
    setFeaturedTags((prevTags) => {
      const updatedTags = prevTags.map((tag, index) => ({
        ...tag,
        sort_index: index + 1,
      }));
      updateChangedTags(updatedTags);
      return updatedTags;
    });
  }, [updateChangedTags]);

  // Auto-fill descending order
  const handleAutoFillDescending = useCallback(() => {
    setFeaturedTags((prevTags) => {
      const updatedTags = prevTags.map((tag, index) => ({
        ...tag,
        sort_index: prevTags.length - index,
      }));
      updateChangedTags(updatedTags);
      return updatedTags;
    });
  }, [updateChangedTags]);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      setFeaturedTags((prevTags) => {
        const oldIndex = prevTags.findIndex((tag) => tag.id === active.id);
        const newIndex = prevTags.findIndex((tag) => tag.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prevTags;

        const newTags = arrayMove(prevTags, oldIndex, newIndex);

        // Update sort_index values based on new positions
        const updatedTags = newTags.map((tag, index) => ({
          ...tag,
          sort_index: newTags.length - index,
        }));

        updateChangedTags(updatedTags);
        return updatedTags;
      });
    },
    [updateChangedTags]
  );

  const handleSortIndexChange = useCallback(
    (tagId: string, newSortIndex: number) => {
      setTempSortValues((prev) => new Map(prev).set(tagId, newSortIndex));
    },
    []
  );

  const handleToggleEdit = useCallback(
    (tagId: string) => {
      setEditingTagIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tagId)) {
          newSet.delete(tagId);
        } else {
          newSet.add(tagId);
          const tag = featuredTags.find((t) => t.id === tagId);
          if (tag) {
            setTempSortValues((prev) =>
              new Map(prev).set(tagId, tag.sort_index || 0)
            );
          }
        }
        return newSet;
      });
    },
    [featuredTags]
  );

  const handleSaveEdit = useCallback(
    (tagId: string) => {
      const newSortIndex = tempSortValues.get(tagId);
      if (newSortIndex === undefined) return;

      setFeaturedTags((prevTags) => {
        const editingTag = prevTags.find((tag) => tag.id === tagId);
        const originalSortIndex = editingTag?.sort_index || 0;

        const conflictingTag = prevTags.find(
          (tag) => tag.id !== tagId && tag.sort_index === newSortIndex
        );

        let updatedTags = [...prevTags];

        if (conflictingTag) {
          const newConflictSortIndex = newSortIndex - 1;
          updatedTags = updatedTags.map((tag) => {
            if (tag.id === conflictingTag.id) {
              return { ...tag, sort_index: Math.max(0, newConflictSortIndex) };
            }
            return tag;
          });

          let cascadeCheck = true;
          let currentCheckIndex = newConflictSortIndex;
          let shiftedTagIds = new Set([conflictingTag.id]);

          while (cascadeCheck && currentCheckIndex >= 0) {
            const nextConflict = updatedTags.find(
              (tag) =>
                tag.id !== tagId &&
                !shiftedTagIds.has(tag.id) &&
                tag.sort_index === currentCheckIndex
            );

            if (nextConflict) {
              const nextNewIndex = currentCheckIndex - 1;

              updatedTags = updatedTags.map((tag) => {
                if (tag.id === nextConflict.id) {
                  return { ...tag, sort_index: Math.max(0, nextNewIndex) };
                }
                return tag;
              });

              shiftedTagIds.add(nextConflict.id);
              currentCheckIndex = nextNewIndex;
            } else {
              cascadeCheck = false;
            }
          }
        }

        updatedTags = updatedTags.map((tag) =>
          tag.id === tagId ? { ...tag, sort_index: newSortIndex } : tag
        );

        const sortedTags = updatedTags.sort(
          (a, b) => (b.sort_index || 0) - (a.sort_index || 0)
        );

        updateChangedTags(sortedTags);
        return sortedTags;
      });

      setEditingTagIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tagId);
        return newSet;
      });

      setTempSortValues((prev) => {
        const newMap = new Map(prev);
        newMap.delete(tagId);
        return newMap;
      });
    },
    [tempSortValues, updateChangedTags]
  );

  const handleCancelEdit = useCallback((tagId: string) => {
    setEditingTagIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(tagId);
      return newSet;
    });

    setTempSortValues((prev) => {
      const newMap = new Map(prev);
      newMap.delete(tagId);
      return newMap;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (changedTagIds.size === 0) {
      message.info("No changes to save");
      return;
    }

    try {
      const tagsToUpdate = featuredTags.filter((tag) =>
        changedTagIds.has(tag.id)
      );
      let successCount = 0;

      for (const tag of tagsToUpdate) {
        try {
          await new Promise((resolve, reject) => {
            updateTagOrder(
              {
                data: { sort_index: tag.sort_index || 0 },
                route: `${tag.id}/`,
              },
              {
                onSuccess: () => {
                  successCount++;
                  resolve(true);
                },
                onError: (error) => reject(error),
              }
            );
          });
        } catch (error) {
          message.error(
            `Failed to update ${tag.tag?.label}: ${processResponseError(error)}`
          );
        }
      }

      if (successCount > 0) {
        message.success("Featured tags order updated successfully!");
        setChangedTagIds(new Set());
        setOriginalTags(featuredTags);
        refetch();
      }
    } catch (error) {
      message.error(
        processResponseError(error) || "Failed to update featured tags order"
      );
    }
  }, [featuredTags, changedTagIds, updateTagOrder, refetch]);

  // Update the tags display to show temp values during editing
  const displayTags = featuredTags.map((tag) => {
    const tempValue = tempSortValues.get(tag.id);
    return tempValue !== undefined ? { ...tag, sort_index: tempValue } : tag;
  });

  return {
    tags: displayTags,
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
  };
};
