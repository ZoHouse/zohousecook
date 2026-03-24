/* eslint-disable @next/next/no-img-element */
import { DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Button, Dropdown, Space, Tag, Tooltip, Typography } from "antd";
import moment from "moment";

export type TimeSlotId = "morning" | "day" | "evening" | "night";

export type Activity = {
  id?: string;
  category?: string;
  type?: string;
  status?: string;
  name?: string;
  start_at?: string; // ISO
  end_at?: string | null; // ISO or null
  skus?: GeneralObject[];
  sku?: GeneralObject; // selected sku instance for this row/date
  description?: string;
};

interface ActivityCellProps {
  activity: Activity;
  slot: TimeSlotId;
  date: Date;
  openEditModal: (
    slot: TimeSlotId,
    date: Date,
    activity: Activity,
    sku?: GeneralObject,
    callback?: () => void
  ) => void;
  removeSKU: (id: string) => void;
}

const ActivityCell = ({
  activity,
  slot,
  date,
  openEditModal,
  removeSKU,
}: ActivityCellProps) => {
  const { data: medias } = useQueryApi<GeneralObject[]>(
    "CAS_PM_MEDIA_INVENTORY",
    {
      enabled: activity.id != null,
      select: (resp) => resp.data.results,
    },
    `${activity.id}/`,
    "limit=-1"
  );

  const skuSource: GeneralObject | undefined = activity.sku;

  const menuItems = [
    {
      key: `edit-${activity.id}`,
      icon: <EditOutlined />,
      label: "Edit",
      onClick: () => openEditModal(slot, date, activity, skuSource, undefined),
    },
    {
      key: `remove-${activity.id}`,
      icon: <DeleteOutlined />,
      label: "Remove",
      onClick: () => removeSKU(activity.sku?.id as string),
    },
  ];
  const startM = activity.start_at
    ? moment(activity.start_at)
    : moment(`${activity.sku?.date}T${activity.sku?.start_time}`);
  const endM = activity.end_at
    ? moment(activity.end_at)
    : activity.sku?.end_time
    ? moment(`${activity.sku?.date}T${activity.sku?.end_time}`)
    : null;
  const showDates = endM ? !startM.isSame(endM, "day") : false;
  const isPaid = skuSource?.price > 0;
  const hasLimitedUnits = skuSource?.has_infinite_units == false;
  const isPast = startM.isBefore(moment().startOf("day"));
  return (
    <div
      key={activity.id}
      className="relative overflow-hidden mb-2 border border-zui-white/20"
    >
      {medias && medias?.[0]?.url && (
        <img
          src={medias?.[0]?.url}
          alt="activity"
          className="absolute inset-0 object-cover"
        />
      )}
      {!isPast ? (
        <div className="absolute top-2 right-2 z-[1]">
          <Dropdown
            menu={{ items: menuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      ) : null}
      <Space
        direction="vertical"
        size={4}
        className="w-full bg-black/80 p-4 relative"
      >
        {(showDates || isPaid || hasLimitedUnits) && (
          <div className="flex gap-1 items-center flex-wrap">
            {showDates ? (
              <Tag color="blue-inverse" className="flex-shrink-0 self-start">
                Multi-Day
              </Tag>
            ) : null}
            {isPaid ? (
              <Tag color="green-inverse" className="flex-shrink-0 self-start">
                Paid
              </Tag>
            ) : null}
            {hasLimitedUnits ? (
              <Tag color="orange-inverse" className="flex-shrink-0 self-start">
                Limited Units
              </Tag>
            ) : null}
          </div>
        )}
        <Tooltip title={showDates ? "Dates & Time" : "Time"}>
          <Typography.Text type="secondary">
            {showDates
              ? `${startM.format("DD MMM, HH:mm")} - ${endM?.format(
                  "DD MMM, HH:mm"
                )}`
              : `${startM.format("HH:mm")}${
                  endM ? ` - ${endM.format("HH:mm")}` : ""
                }`}
          </Typography.Text>
        </Tooltip>
        <Typography.Text strong style={{ fontSize: 16 }}>
          {activity.name}
        </Typography.Text>
      </Space>
    </div>
  );
};

export default ActivityCell;
