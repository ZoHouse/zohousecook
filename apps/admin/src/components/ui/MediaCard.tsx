import { CopyOutlined, DeleteOutlined, FileOutlined } from "@ant-design/icons";
import { cn } from "@zo/utils/font";
import { isImageUri } from "@zo/utils/string";
import { Card, Image, Tooltip, Typography } from "antd";
import { Meta } from "antd/es/list/Item";
import React, { useState } from "react";
import { CASMediaResponse } from "../../config";

const { Text, Title } = Typography;

interface MediaCardProps {
  media: CASMediaResponse;
  onCopyMediaLink: (url: string) => void;
  onDeleteMedia: (id: string) => void;
  className?: string;
}

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/21b93ca1-1443-4d6c-b053-84b6fe2b1eac_20241121125632.svg";

const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onCopyMediaLink,
  onDeleteMedia,
  className,
}) => {
  const [isError, setIsError] = useState<boolean>(false);

  const renderMediaPreview = () => {
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <FileOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />
          <Text type="secondary">No Preview Available</Text>
        </div>
      );
    }

    // check if the src is any type of video eg. mp4, aac, etc.
    const isVideo = media.url?.includes("mp4") || media.url?.includes("aac");

    // check if the src is any type of image eg. png, jpg, jpeg, etc.
    const isImage = isImageUri(media.url);

    return (
      <Card
        style={{ width: 300 }}
        className={cn("h-full w-[300px] rounded-none", className)}
        cover={
          isError ? (
            <img src={DEFAULT_IMAGE} alt="default" />
          ) : isImage ? (
            <div key={media.id} className="relative">
              <Image
                src={`${media.url}?w=300`}
                alt={media?.metadata?.alt || "Review media"}
                preview={{
                  src: media.url,
                  title: (
                    <div className="mt-10">
                      <Title level={4}>{media?.metadata?.title}</Title>
                      <Text>{media?.metadata?.description}</Text>
                    </div>
                  ),
                  animation: true,
                }}
                width={300}
                height={200}
                className="object-cover"
                onError={() => setIsError(true)}
              />
            </div>
          ) : isVideo ? (
            <div key={media.id} className="relative max-h-[200px]">
              <video
                src={media.url}
                controls={false}
                width={300}
                height={200}
                autoPlay
                muted
                className="max-h-[200px]"
                onError={() => setIsError(true)}
              />
            </div>
          ) : (
            <img src={DEFAULT_IMAGE} alt="default" />
          )
        }
        actions={[
          <Tooltip title="Copy URL" key="copy">
            <CopyOutlined onClick={onCopyMediaLink.bind(null, media.url)} />
          </Tooltip>,
          <Tooltip title="Delete" key="delete">
            <DeleteOutlined onClick={onDeleteMedia.bind(null, media.id)} />
          </Tooltip>,
        ]}
      >
        <Meta title={media?.metadata?.title || "Untitled"} />
      </Card>
    );
  };

  return renderMediaPreview();
};

export default MediaCard;
