import {
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { Button, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface TripOrderControlsProps {
  onAutoFillAscending: () => void;
  onAutoFillDescending: () => void;
  editingTripIds: Set<string>;
  changedTripIds: Set<string>;
}

const TripOrderControls: React.FC<TripOrderControlsProps> = ({
  onAutoFillAscending,
  onAutoFillDescending,
  editingTripIds,
  changedTripIds,
}) => {
  const hasChanges = changedTripIds.size > 0;

  return (
    <div className="space-y-4">
      <div className="bg-zui-light p-3">
        <Text className="text-sm text-zui-silver">
          Drag and drop to reorder how active trips appear in the website header
          dropdown, or click ✏️ Edit to manually change sort index values.
          Higher sort index values appear first in the dropdown.
        </Text>
      </div>

      {/* Auto-fill controls */}
      <div className="flex gap-2">
        <Button
          icon={<SortAscendingOutlined />}
          onClick={onAutoFillAscending}
          size="small"
          type="default"
        >
          Auto-fill ASC (1,2,3...)
        </Button>
        <Button
          icon={<SortDescendingOutlined />}
          onClick={onAutoFillDescending}
          size="small"
          type="default"
        >
          Auto-fill DESC (High to Low)
        </Button>
      </div>

      {editingTripIds.size > 0 && (
        <div className="bg-zui-dark p-3 border border-zui-neon">
          <Text className="text-sm text-zui-neon">
            ✏️ {editingTripIds.size} trip(s) in edit mode. Click ✅ to save
            changes and reorder, or ❌ to cancel.
          </Text>
        </div>
      )}

      {hasChanges && (
        <div className="bg-zui-dark p-3 border border-zui-white">
          <Text className="text-sm text-zui-neon">
            ⚡ {changedTripIds.size} trip(s) changed.
          </Text>
          {changedTripIds.size > 1 && (
            <div className="mt-2">
              <Text className="text-xs text-zui-silver">
                💡 Note: If you set a sort_index to an existing value,
                conflicting trips are automatically shifted down to avoid
                duplicates.
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripOrderControls;
