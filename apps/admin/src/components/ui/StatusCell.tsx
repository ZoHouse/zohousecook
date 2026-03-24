import React from "react";
import statusColorMapping from "../../config/StatusColor.json";

interface StatusCellProps {
  status: string;
}

const StatusCell: React.FC<StatusCellProps> = ({ status }) => {
  return (
    <span
      className={
        statusColorMapping[status as keyof typeof statusColorMapping]
          ? statusColorMapping[status as keyof typeof statusColorMapping]
          : "text-zui-white"
      }
    >
      {status}
    </span>
  );
};

export default StatusCell;
