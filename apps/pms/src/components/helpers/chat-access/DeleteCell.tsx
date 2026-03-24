import { DeleteOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import React from "react";

interface DeleteCellProps {
  onDelete: () => void;
}

const DeleteCell: React.FC<DeleteCellProps> = ({ onDelete }) => {
  return (
    <div className="w-16 relative">
      <Tooltip title="Remove recipient">
        <Popconfirm
          title="Confirm Removal"
          description="Are you sure you want to remove this recipient?"
          onConfirm={onDelete}
          okText="Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            className="flex items-center justify-center"
            aria-label="Remove recipient"
          />
        </Popconfirm>
      </Tooltip>
    </div>
  );
};

export default DeleteCell;
