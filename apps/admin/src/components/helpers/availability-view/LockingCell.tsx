import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { Button, List, Popover, message } from "antd";
import { LockingWithColumnIndex } from "apps/admin/src/pages/availability-view/[[...slug]]";
import React, { useMemo } from "react";

interface LockingCellProps {
  locking: LockingWithColumnIndex;
  refetch: () => void;
}

const LockingCell: React.FC<LockingCellProps> = ({ locking, refetch }) => {
  const { mutate: deleteLocking } = useMutationApi(
    "CAS_LOCKING",
    {},
    ``,
    "DELETE"
  );

  const left = useMemo(() => {
    if (locking.isOlder || locking.columnIndex === 0) {
      return 8;
    } else {
      return 56 + 4;
    }
  }, [locking]);

  const width = useMemo(() => {
    let initialCellBuffer = 0;

    if (locking.columnIndex === 0) {
      initialCellBuffer += 96 / 2;
    }

    const baseWidth = 96 * Math.max(locking.columnSpan, 1) + initialCellBuffer;
    const totalBorders = 1 * (Math.max(locking.columnSpan, 1) - 1);

    if (locking.isOlder) {
      if (locking.isLaterEnding) {
        return baseWidth + totalBorders - 16;
      } else {
        return baseWidth - 96 + 44;
      }
    } else {
      if (locking.isLaterEnding) {
        return 56 + baseWidth + totalBorders - 12;
      } else {
        return baseWidth + totalBorders - 12;
      }
    }
  }, [locking]);

  const handleDelete = () => {
    deleteLocking(
      {
        data: {},
        route: `${locking.id.toString()}/`,
      },
      {
        onSuccess() {
          message.success("Locking deleted successfully");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const popoverContent = (
    <div className="w-60">
      <List
        size="small"
        split={false}
        dataSource={[
          {
            label: "Reason",
            value: locking?.reason || "No reason provided",
          },
          {
            label: "Date",
            value: locking.date,
          },
          {
            label: "Note",
            value: locking.note,
          },
        ]}
        renderItem={(item) => (
          <List.Item>
            <div className="text-sm flex justify-between w-full items-center">
              <strong className="font-medium">{item.label}</strong>
              <div className="text-zui-silver">{item.value || "N/A"}</div>
            </div>
          </List.Item>
        )}
        footer={
          <div className="flex justify-end">
            <Button icon={<DeleteOutlineIcon />} danger onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      />
    </div>
  );

  return (
    <Popover content={popoverContent} trigger="hover" placement="bottom">
      <div
        className="hover:z-[2] absolute cursor-pointer bottom-0 h-full max-h-14 flex items-center gap-x-3 justify-start px-4 bg-zui-lighter border border-zui-light locking-cell-background"
        style={{
          left: left,
          width: width,
        }}
      >
        <LockClockOutlinedIcon className="text-zui-white" fontSize="small" />
        <span className="truncate font-normal">
          {locking?.reason || "Zo User"}
        </span>
      </div>
    </Popover>
  );
};

export default LockingCell;
