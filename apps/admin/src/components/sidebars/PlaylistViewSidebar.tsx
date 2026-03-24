import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import { Button, Card, Descriptions, Drawer, Image, message, Tag } from "antd";
import React from "react";

interface PlaylistViewSidebarProps {
  playlistId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (playlistId: string) => void;
}

const PlaylistViewSidebar: React.FC<PlaylistViewSidebarProps> = ({
  playlistId,
  isOpen,
  onClose,
  onEdit,
}) => {
  const {
    data: playlist,
    isLoading: isPlaylistLoading,
    isFetching: isPlaylistFetching,
  } = useQueryApi<GeneralObject>(
    "CAS_PLAYLISTS",
    {
      enabled: isValidString(playlistId) && isOpen,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
      select: (data) => data.data,
    },
    `${playlistId}/`
  );

  const {
    data: tracks,
    isLoading: isTracksLoading,
    isFetching: isTracksFetching,
  } = useQueryApi<GeneralObject[]>(
    "CAS_PLAYTRACKS",
    {
      enabled: isValidString(playlistId) && isOpen,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
      select: (data) => data.data as GeneralObject[],
    },
    "",
    `playlist=${playlistId}&limit=-1`
  );

  const handleCopyLink = () => {
    if (playlist?.title && playlist?.pid) {
      // Convert title to slug
      const slug = playlist.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const link = `zostel.com/list/${slug}-${playlist.pid}`;

      navigator.clipboard
        .writeText(link)
        .then(() => {
          message.success("Link copied to clipboard!");
        })
        .catch(() => {
          message.error("Failed to copy link");
        });
    }
  };

  const handleEdit = () => {
    onEdit(playlistId);
    onClose();
  };

  const getStatusColor = (status: string) => {
    const statusColors: GeneralObject = {
      active: "success",
      inactive: "default",
      unpublished: "warning",
    };
    return statusColors[status] || "default";
  };

  return (
    <Drawer
      title="Playlist Details"
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={520}
      loading={isPlaylistLoading || isPlaylistFetching}
      extra={
        <div className="flex gap-2">
          <Button
            icon={<Icon name="Copy" size={16} />}
            onClick={handleCopyLink}
            disabled={!playlist?.title || !playlist?.pid}
          >
            Copy Link
          </Button>
          <Button
            type="primary"
            icon={<Icon name="Edit" size={16} />}
            onClick={handleEdit}
          >
            Edit
          </Button>
        </div>
      }
    >
      {playlist && (
        <div className="space-y-6">
          {/* Cover Image */}
          {isValidString(playlist.cover_image) && (
            <div className="mb-4">
              <Image
                src={playlist.cover_image}
                alt={playlist.title}
                className="rounded-lg"
                style={{ width: "100%" }}
              />
            </div>
          )}

          {/* Basic Information */}
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Title">
              {playlist.title || "N/A"}
            </Descriptions.Item>

            {isValidString(playlist.subtitle) && (
              <Descriptions.Item label="Subtitle">
                {playlist.subtitle}
              </Descriptions.Item>
            )}

            {isValidString(playlist.description) && (
              <Descriptions.Item label="Description">
                {playlist.description}
              </Descriptions.Item>
            )}

            <Descriptions.Item label="PID">
              {playlist.pid || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(playlist.status)}>
                {(playlist.status || "unpublished").toUpperCase()}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Structure">
              {playlist.structure
                ?.replace(/-/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase()) || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Order">
              {playlist.data?.order ? "In-Order" : "Random"}
            </Descriptions.Item>

            {isValidString(playlist.created_at) && (
              <Descriptions.Item label="Created At">
                {new Date(playlist.created_at).toLocaleString()}
              </Descriptions.Item>
            )}

            {isValidString(playlist.updated_at) && (
              <Descriptions.Item label="Updated At">
                {new Date(playlist.updated_at).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Playlist Tracks */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">
              Playlist Items ({tracks?.length || 0})
            </h3>
            {isTracksLoading || isTracksFetching ? (
              <div className="text-center py-4 text-zui-silver">
                Loading tracks...
              </div>
            ) : tracks && tracks.length > 0 ? (
              <div className="space-y-2">
                {tracks.map((track: any, index: number) => (
                  <Card key={track.id} size="small">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col flex-1">
                        <div className="font-medium">
                          {index + 1}.{" "}
                          {track.track_data?.title ||
                            track.track_data?.name ||
                            "Untitled"}
                        </div>
                        <div className="text-xs text-zui-silver mt-1 capitalize">
                          Type: {track.relation_type}
                        </div>
                        {track.track_data?.subtitle && (
                          <div className="text-xs text-zui-silver mt-1">
                            {track.track_data.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-zui-silver">
                No tracks in this playlist
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default PlaylistViewSidebar;
