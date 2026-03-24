import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Button, Drawer, Form, Input, Popover, Select, Space } from "antd";
import { FormInstance } from "antd/lib/form";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface EditItineraryDetailProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItinerary: string;
  section: any;
}

// Main component
const EditItineraryDetail: React.FC<EditItineraryDetailProps> = ({
  isOpen,
  selectedItinerary,
  onClose,
  section,
}) => {
  return (
    <Drawer
      title={`Add Itinerary Details`}
      placement="right"
      open={isOpen}
      width={400}
      onClose={onClose}
      extra={
        <Space>
          <Button
            // onClick={() => handleAddItems(currentSection, drawerItems)}
            type="primary"
            // disabled={drawerItems.length === 0}
          >
            Save
          </Button>
        </Space>
      }
    >
      <div>hey</div>
    </Drawer>
  );
};

export default EditItineraryDetail;
