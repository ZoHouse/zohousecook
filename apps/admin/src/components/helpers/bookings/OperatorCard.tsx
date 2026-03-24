import { cn } from "@zo/utils/font";
import { Card, Image, Skeleton } from "antd";
import Meta from "antd/es/card/Meta";
import { ZoHouse } from "apps/admin/src/config";
import React, { useState } from "react";

interface OperatorCardProps {
  data: ZoHouse;
  onClick: (operatorId: string | null) => void;
  active: boolean;
  loading?: boolean;
}

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/8cc7fea5-927f-48a2-9083-f919657d0d0a_20241124074205.svg";

const OperatorCard: React.FC<OperatorCardProps> = ({
  data,
  onClick,
  active,
  loading = false,
}) => {
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return (
      <Card className="border-none w-full aspect-square">
        <Skeleton.Image active className="h-32 w-full" />
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  return (
    <Card
      key={data.id}
      hoverable
      onClick={() => onClick(active ? null : data.id)}
      className={cn(
        "border border-zui-light w-full aspect-square",
        active && "outline outline-1 outline-zui-neon"
      )}
      cover={
        <div className={cn("bg-transparent flex items-center justify-center overflow-hidden h-32")}>
          <Image
            src={
              !imageError && data.media[0]?.url
                ? data.media[0]?.url
                : DEFAULT_IMAGE
            }
            alt={data.name || "Zo House"}
            preview={false}
            className="h-full w-full object-cover p-[1px]"
            onError={() => setImageError(true)}
            fallback={DEFAULT_IMAGE}
          />
        </div>
      }
    >
      <Meta
        title={data?.name || "Zo House"}
        description={data?.destination.name}
      />
    </Card>
  );
};

export default OperatorCard;