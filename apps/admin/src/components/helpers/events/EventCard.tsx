import { Typography, Tag, Space } from "antd";
import { LiveTv, AccessTime } from "@mui/icons-material";
import { cn } from "@zo/utils/font";
import { Inventory } from "apps/admin/src/config";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { Lines } from "../../vectors";

interface EventCardProps {
  data: Inventory;
  onClick: () => void;
}

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/8cc7fea5-927f-48a2-9083-f919657d0d0a_20241124074205.svg";

const EventCard: React.FC<EventCardProps> = ({ data, onClick }) => {
  const isActive = useMemo(() => {
    const currentTime = dayjs();
    return (
      currentTime.isAfter(dayjs(data.start_at)) &&
      currentTime.isBefore(dayjs(data.end_at))
    );
  }, [data]);

  const [isError, setIsError] = useState<boolean>(false);

  return (
    <div
      onClick={onClick}
      className="md:max-w-3/4 bg-zui-lighter relative overflow-hidden cursor-pointer p-4 md:p-6 flex flex-col-reverse gap-4 md:grid grid-cols-3 hover:bg-zui-light transition-colors"
    >
      <Lines className="absolute -top-[25%] -left-[60%] w-[220%] h-[300%]" />
      <div className="relative flex flex-col items-start flex-grow self-start col-span-2">
        <Space direction="vertical" size="small" className="w-full">
          <Space>
            <Space>
              <AccessTime fontSize="small" />
              <Typography.Text>
                {dayjs(data.start_at).format("h:mm A")}
              </Typography.Text>
            </Space>

            <Tag
              color={data.status === "active" ? "success" : "error"}
              className="capitalize m-0"
              bordered={false}
            >
              {data.status}
            </Tag>

            {isActive && (
              <Tag color="warning" className="capitalize m-0" bordered={false}>
                <Space size={4}>
                  <LiveTv fontSize="small" />
                  <span>LIVE</span>
                </Space>
              </Tag>
            )}
          </Space>

          <Typography.Title level={4} className="!mb-0">
            {data.name}
          </Typography.Title>
        </Space>
      </div>

      {isError ? (
        <div className="bg-gray-100 text-gray-500 w-full aspect-video flex justify-center items-center text-sm">
          Couldn't Load Image
        </div>
      ) : (
        <div className="col-span-1 w-full aspect-video overflow-hidden flex-shrink-0">
          <img
            src={
              data?.media?.length > 0
                ? `${data?.media?.[0]?.url}?w=400`
                : DEFAULT_IMAGE
            }
            alt={data?.media?.[0]?.metadata?.alt || ""}
            className="w-full h-full object-cover relative md:flex-shrink-0"
            onError={() => setIsError(true)}
          />
        </div>
      )}
    </div>
  );
};

export default EventCard;
