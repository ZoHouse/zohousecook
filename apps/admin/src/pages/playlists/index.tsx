import Icon from "@zo/assets/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import { Button, Spin, Table, Tag } from "antd";
import { ColumnType } from "antd/es/table";
import { NextPage } from "next";
import { useMemo, useState } from "react";
import AddPlaylistSidebar from "../../components/sidebars/AddPlaylist";
import PlaylistViewSidebar from "../../components/sidebars/PlaylistViewSidebar";
import { Page, PageContent, PageHeader } from "../../components/ui2";

const PAGE_SIZE = 50;

const ZostelHomePlaylists: NextPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string[]>([]);
  const [isPlaylistAddVisible, setPlaylistAddVisible] = useState<
    [string, string]
  >(["", ""]);
  const [viewPlaylistId, setViewPlaylistId] = useState<string>("");

  const {
    data: playlistsData,
    isLoading: isLoadingPlaylists,
    refetch,
  } = useQueryApi(
    "CAS_PLAYLISTS",
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
    },
    "",
    `limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}${
      status.length ? `&status=${status.join(",")}` : ""
    }`
  );

  const { mutate: addPlaylist, isLoading: isAddingPlaylist } =
    useMutationApi("CAS_PLAYLISTS");
  const { mutate: updatePlaylist, isLoading: isUpdatingPlaylist } =
    useMutationApi("CAS_PLAYLISTS", {}, "", "PUT");
  const { mutate: addPlaylistTracks, isLoading: isAddingPlaylistTracks } =
    useMutationApi("CAS_PLAYTRACKS_BULK_CREATE");
  const { mutate: deletePlaylistTracks, isLoading: isDeletingPlaylistTracks } =
    useMutationApi("CAS_PLAYTRACKS_BULK_DELETE", {}, "", "DELETE");
  const { mutate: updatePlaylistTracks, isLoading: isUpdatingPlaylistTracks } =
    useMutationApi("CAS_PLAYTRACKS_BULK_UPDATE", {}, "", "PUT");

  const isLoading = useMemo(() => {
    return (
      isLoadingPlaylists ||
      isAddingPlaylist ||
      isUpdatingPlaylist ||
      isAddingPlaylistTracks ||
      isDeletingPlaylistTracks ||
      isUpdatingPlaylistTracks
    );
  }, [
    isLoadingPlaylists,
    isAddingPlaylist,
    isUpdatingPlaylist,
    isAddingPlaylistTracks,
    isDeletingPlaylistTracks,
    isUpdatingPlaylistTracks,
  ]);

  const playlists = playlistsData?.data.results || [];
  const total = playlistsData?.data?.count || 0;

  const columns: ColumnType<GeneralObject>[] = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string) => text || "No Title",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
        { text: "Unpublished", value: "unpublished" },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      filteredValue: status,
      filterMode: "menu",
      render: (text: string) => {
        const statusColors: GeneralObject = {
          active: "success",
          inactive: "default",
          unpublished: "warning",
        };
        const status = text || "unpublished";
        return <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  const handlePlaylistClose = (data: GeneralObject) => {
    if (isValidObject(data)) {
      if (data.isUpdate) {
        // Find tracks to delete and add
        const originalTrackIds = data.originalTracks.map(
          (t: any) => t.relation_id
        );
        const newTrackIds = data.tracks.map((t: any) => t.relation_id);

        const tracksToDelete = data.originalTracks
          .filter((t: any) => !newTrackIds.includes(t.relation_id))
          .map((t: any) => t.id);

        const tracksToAdd = data.tracks.filter(
          (t: any) => !originalTrackIds.includes(t.relation_id)
        );

        const unchangedTracks = data.originalTracks.filter((t: any) =>
          newTrackIds.includes(t.relation_id)
        );

        // Check for sort_index changes in unchanged tracks
        const tracksToUpdate = unchangedTracks
          .filter((originalTrack: any) => {
            const newTrack = data.tracks.find(
              (t: any) => t.relation_id === originalTrack.relation_id
            );
            return newTrack && newTrack.sort_index !== originalTrack.sort_index;
          })
          .map((track: any) => {
            const newTrack = data.tracks.find(
              (t: any) => t.relation_id === track.relation_id
            );
            return {
              id: track.id,
              sort_index: newTrack.sort_index,
            };
          });

        // Create array of promises for track operations
        const promises: Promise<any>[] = [];

        promises.push(
          new Promise((resolve) =>
            updatePlaylist(
              {
                data: data.playlist, // FormData object, don't spread
                route: data.originalPlaylist.id + "/",
              },
              { onSuccess: (data) => resolve(data) }
            )
          )
        );

        if (tracksToDelete.length > 0) {
          promises.push(
            new Promise((resolve) =>
              deletePlaylistTracks(
                { data: tracksToDelete },
                { onSuccess: (data) => resolve(data) }
              )
            )
          );
        }

        if (tracksToAdd.length > 0) {
          promises.push(
            new Promise((resolve) =>
              addPlaylistTracks(
                {
                  data: tracksToAdd.map((t: any) => ({
                    ...t,
                    playlist: data.originalPlaylist.id,
                  })),
                },
                { onSuccess: (data) => resolve(data) }
              )
            )
          );
        }

        if (tracksToUpdate.length > 0) {
          promises.push(
            new Promise((resolve) =>
              updatePlaylistTracks(
                { data: tracksToUpdate },
                { onSuccess: (data) => resolve(data) }
              )
            )
          );
        }

        // Wait for all track operations to complete
        Promise.all(promises).then(() => {
          refetch();
        });
      } else {
        // Handle new playlist creation
        addPlaylist(
          {
            data: data.playlist, // FormData object, don't spread
          },
          {
            onSuccess: (playlistData) => {
              if (data.tracks?.length) {
                addPlaylistTracks(
                  {
                    data: [
                      ...data.tracks.map((t: GeneralObject) => ({
                        ...t,
                        playlist: playlistData.data.id,
                      })),
                    ],
                  },
                  {
                    onSuccess: () => {
                      refetch();
                    },
                  }
                );
              } else {
                refetch();
              }
            },
          }
        );
      }
    }
    setPlaylistAddVisible(["", ""]);
  };

  const handleRowClick = (record: any) => {
    setViewPlaylistId(record.id);
  };

  const handleViewClose = () => {
    setViewPlaylistId("");
  };

  const handleEditFromView = (playlistId: string) => {
    setPlaylistAddVisible(["edit", playlistId]);
  };

  return (
    <Page>
      <PageHeader
        title="All Playlists"
        breadcrumbs={[
          {
            name: "All Playlists",
            id: "all-playlists",
            url: "/zostel-home/playlists",
          },
        ]}
        rightOptions={
          <Button
            onClick={() => setPlaylistAddVisible(["new", ""])}
            icon={<Icon name="Plus" size={24} />}
          >
            Create Playlist
          </Button>
        }
      />
      <PageContent>
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <Spin size="large" />
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Table
            columns={columns}
            dataSource={playlists}
            loading={isLoading}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              onChange: setPage,
            }}
          />
        </div>
        <AddPlaylistSidebar
          isOpen={isPlaylistAddVisible}
          onClose={handlePlaylistClose}
        />
        <PlaylistViewSidebar
          playlistId={viewPlaylistId}
          isOpen={!!viewPlaylistId}
          onClose={handleViewClose}
          onEdit={handleEditFromView}
        />
      </PageContent>
    </Page>
  );
};

export default ZostelHomePlaylists;
