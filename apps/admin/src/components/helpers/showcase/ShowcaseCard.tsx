import { GeneralObject } from "@zo/definitions/general";
import { combineRouteAndQueryParams, formatCapitalize } from "@zo/utils/string";
import { Button, Flex, Tag, Tooltip, Typography } from "antd";
import React from "react";

import { AddOutlined, EditOutlined } from "@mui/icons-material";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import { useRouter } from "next/router";
import { cn } from "@zo/utils/font";

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/42bd2fc9-7968-40e5-a9b9-77d33958ceae_20250116135406.svg";

interface ShowcaseCardProps {
  display: GeneralObject;
  selected: boolean;
}

const ShowcaseCard: React.FC<ShowcaseCardProps> = ({
  display,

  selected,
}) => {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "expired":
        return "error";
      default:
        return "orange";
    }
  };

  const getImageUrl = (display: GeneralObject) => {
    if (display.session?.[0]?.showcase_type === "promotional") {
      return display?.showcase?.[0]?.media?.url;
    }

    if (display.session?.[0]?.showcase_type === "collected") {
      return display?.showcase?.[0]?.nft?.image;
    }

    if (display.session?.[0]?.showcase_type === "artist") {
      return display?.showcase?.[0]?.art?.image;
    }

    return DEFAULT_IMAGE;
  };

  const handleSessionEdit = (sessionId: string) => {
    router.push(
      combineRouteAndQueryParams(`/showcase/session/${sessionId}`, {
        ...router.query,
        estate: display.estate.id,
        space: display.space.id,
        display: display.id,
      }),
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleNewSession = () => {
    router.push(
      combineRouteAndQueryParams(`/showcase/session/new`, {
        ...router.query,
        estate: display.estate.id,
        space: display.space.id,
        display: display.id,
      }),
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleDisplayEdit = (displayId: string) => {
    router.push(
      combineRouteAndQueryParams(
        `/showcase/display/${displayId}`,
        router.query
      ),
      undefined,
      {
        shallow: true,
      }
    );
  };

  return (
    <Flex
      role="button"
      className={cn(
        "w-[400px] h-[200px] border border-zui-lightest overflow-hidden",
        selected && "border-zui-neon"
      )}
    >
      <div className="h-full w-full max-w-[220px] aspect-square relative group">
        {display.session.length <= 0 && (
          <div
            role="button"
            onClick={handleNewSession}
            className="flex flex-col items-center justify-center absolute top-0 left-0 w-full h-full bg-black/80 group-hover:opacity-100 opacity-0 transition-opacity ease-out"
          >
            <AddOutlined fontSize="large" />
            <Typography.Text>Click to add Session</Typography.Text>
          </div>
        )}

        <img
          className="h-full w-full object-cover aspect-square"
          src={getImageUrl(display)}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = DEFAULT_IMAGE;
          }}
          alt="Showcase Session Image"
        />
      </div>
      <Flex
        justify="start"
        align="start"
        vertical
        id="meta"
        className="bg-zui-light w-full flex-1 p-4"
        gap={8}
      >
        <Flex vertical flex={1} gap={4} className="overflow-y-auto w-full">
          <Typography.Text strong>{display?.name}</Typography.Text>

          {display.session?.[0]?.showcase_type && (
            <Typography.Text type="secondary">
              {formatCapitalize(display.session?.[0]?.showcase_type)}
            </Typography.Text>
          )}

          {display.session?.[0]?.status && (
            <Tag
              bordered={false}
              color={getStatusColor(display.session?.[0]?.status)}
              className="w-fit"
            >
              {formatCapitalize(display.session?.[0]?.status || "")}
            </Tag>
          )}
        </Flex>

        <Flex justify="between" align="center" gap={16}>
          <Tooltip title="Edit Display">
            <Button onClick={handleDisplayEdit.bind(null, display.id)}>
              <DevicesOutlinedIcon fontSize="small" />
            </Button>
          </Tooltip>

          {display.session.length > 0 ? (
            <Tooltip title="Edit Session">
              <Button
                onClick={handleSessionEdit.bind(null, display.session[0].id)}
              >
                <EditOutlined fontSize="small" />
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Add Session">
              <Button onClick={handleNewSession}>
                <AddOutlined fontSize="small" />
              </Button>
            </Tooltip>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ShowcaseCard;
