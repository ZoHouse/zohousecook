import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutationApi, useQueriesApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page } from "@zo/moal";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Button, Input, Popconfirm, Spin, Tag } from "antd";
import isEqual from "lodash.isequal";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 } from "uuid";
import AddPlaylistSidebar from "../../components/sidebars/AddPlaylist";
import SearchPlaylistSidebar from "../../components/sidebars/SearchPlaylist";
import { PageContent, PageHeader } from "../../components/ui2";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

interface PlaylistProps {
  id: string;
  title?: string;
  subtitle?: string;
  priority: number;
  isDynamic: boolean;
  tracks: GeneralObject[];
  editPlaylist: () => void;
}

interface SectionProps {
  id: string;
  title?: string;
  subtitle?: string;
  playlists: PlaylistProps[];
  onUpdate?: (updates: Partial<SectionProps>) => void;
  onDelete?: () => void;
  showPlaylistAddModal: (playlistId?: string) => void;
  showSearchPlaylistModal: () => void;
}

const PlaylistAdmin: NextPage = () => {
  const [sections, setSections] = useState<GeneralObject[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<string[]>([]);
  const fetchedOnce = useRef<boolean>(false);
  const router = useRouter();
  const [isPlaylistAddVisible, setPlaylistAddVisible] = useState<
    [string, string]
  >(["", ""]); // section, playlist
  const [isSearchPlaylistVisible, setSearchPlaylistVisible] =
    useState<string>("");

  const { data: seedData, isFetching: isSeedFetching } =
    useQueryApi<GeneralObject>("CAS_SEED", {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      select: (data) => data.data.discover.home_page,
    });

  const { mutate: updateHomePage, isLoading: isUpdatingHomePage } =
    useMutationApi("CAS_HOME_PAGE");
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

  const { isFetching: isHomePageFetching } = useQueryApi("CAS_HOME_PAGE", {
    enabled: seedData != null,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    onSuccess: (data) => {
      const _sections = data.data?.[0]?.data.sections;
      const allPlaylists = _sections
        ? _sections.flatMap((s: SectionProps) => s.playlists)
        : [];
      setAllPlaylists(allPlaylists);
      const filledSections = _sections.map((_section: any) => ({
        ..._section,
        playlists: _section.playlists.map((p: any) =>
          seedData?.dynamic_playlists?.includes(p)
            ? {
                id: p,
                title: p,
                isDynamic: true,
                tracks: [],
              }
            : {
                id: p,
                tracks: [],
              }
        ),
      }));
      setSections(filledSections);
    },
  });

  const { isFetching: isPlaylistsFetching, isLoading: isPlaylistsLoading } =
    useQueryApi(
      "CAS_PLAYLISTS",
      {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        enabled: allPlaylists.length > 0,
        onSuccess: (data) => {
          const filledPlaylists = data.data;
          setSections((s) =>
            s.map((section) => ({
              ...section,
              playlists: section.playlists.map((p: any) => {
                const playlist = filledPlaylists.find(
                  (fp: any) => fp.id === p.id
                );
                if (playlist) {
                  return {
                    ...playlist,
                    tracks: playlist?.tracks || [],
                  };
                }
                return p;
              }),
            }))
          );
        },
      },
      "",
      `ids=${allPlaylists.join(",")}&limit=-1`
    );

  const allTracks = useQueriesApi(
    "CAS_PLAYTRACKS",
    {
      enabled:
        allPlaylists.length > 0 && seedData != null && !fetchedOnce.current,
      refetchOnWindowFocus: false,
    },
    allPlaylists
      .filter((p) => !seedData?.dynamic_playlists?.includes(p))
      .map((p) => ["", `playlist=${p}&limit=-1`])
  );

  const isTracksLoading = useMemo(() => {
    return allTracks?.some((track) => track.isLoading || track.isFetching);
  }, [allTracks]);

  const isLoading = useMemo(() => {
    return (
      isUpdatingHomePage ||
      isAddingPlaylist ||
      isUpdatingPlaylist ||
      isAddingPlaylistTracks ||
      isPlaylistsFetching ||
      isDeletingPlaylistTracks ||
      isUpdatingPlaylistTracks ||
      isSeedFetching ||
      isHomePageFetching ||
      isPlaylistsLoading ||
      isTracksLoading
    );
  }, [
    isUpdatingHomePage,
    isAddingPlaylist,
    isPlaylistsFetching,
    isUpdatingPlaylist,
    isAddingPlaylistTracks,
    isDeletingPlaylistTracks,
    isUpdatingPlaylistTracks,
    isSeedFetching,
    isHomePageFetching,
    isPlaylistsLoading,
    isTracksLoading,
  ]);

  useEffect(() => {
    return () => {
      fetchedOnce.current = false;
      setAllPlaylists([]);
      setSections([]);
    };
  }, []);

  useEffect(() => {
    if (
      allTracks?.length > 0 &&
      allTracks.every((a) => a.status === "success") &&
      !fetchedOnce.current
    ) {
      const playlistsTracks = allTracks.filter((a) => a.data.data.length > 0);
      const playlistTracks: GeneralObject = {};
      playlistsTracks.forEach((a) => {
        playlistTracks[a.data.data[0].playlist] = a.data.data;
      });
      const newSections = sections.map((section) => ({
        ...section,
        playlists: section.playlists.map((p: any) => ({
          ...p,
          tracks: playlistTracks[p.id] || [],
        })),
      }));
      fetchedOnce.current = true;
      if (!isEqual(sections, newSections)) {
        setSections(newSections);
      }
    }
  }, [allTracks]);

  const showPlaylistAddModal = (sectionId: string, playlistId?: string) => {
    setPlaylistAddVisible([sectionId, playlistId || ""]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over.id);
      updateSectionsWithAPI(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const updateSection = (sectionId: string, updates: Partial<SectionProps>) => {
    const updatedSections = sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateSectionsWithAPI(updatedSections);
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter((section) => section.id !== sectionId));
    updateHomePage({
      data: {
        data: {
          sections: sections.filter((s) => s.id !== sectionId),
        },
      },
    });
  };

  const updateSectionsWithAPI = (updatedSections: Partial<SectionProps>[]) => {
    const updatedSectionsForAPI = updatedSections.map((s) => ({
      ...s,
      playlists: (s.playlists || []).map((p: GeneralObject) => p.id),
    }));
    setSections(updatedSections);
    updateHomePage({
      data: {
        data: {
          sections: updatedSectionsForAPI,
        },
      },
    });
  };

  const addSection = () => {
    const newSection: Partial<SectionProps> = {
      id: v4(),
      title: "",
      subtitle: "",
      playlists: [],
    };
    const updatedSections = [...sections, newSection];
    updateSectionsWithAPI(updatedSections);
  };

  const handlePlaylistClose = (data: GeneralObject, sectionId: string) => {
    if (isValidObject(data) && sectionId) {
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
        Promise.all(promises).then((results) => {
          // Map tracks with their updated sort indices from data.tracks
          const updatedTrackMap = new Map(
            data.tracks.map((t: any) => [t.relation_id, t.sort_index])
          );

          // Get results based on which operations were performed
          let resultIndex = 1; // Start from 1 since updatePlaylist is first
          let addedTracks: any[] = [];
          let updatedTracks: any[] = [];

          if (tracksToDelete.length > 0) resultIndex++;
          if (tracksToAdd.length > 0) {
            addedTracks = results[resultIndex]?.data || [];
            resultIndex++;
          }
          if (tracksToUpdate.length > 0) {
            updatedTracks = results[resultIndex]?.data || [];
          }

          // Combine all tracks and ensure correct sort_index
          const allTracks = [
            ...unchangedTracks.map((t: GeneralObject) => ({
              ...t,
              sort_index: updatedTrackMap.get(t.relation_id) || t.sort_index,
            })),
            ...updatedTracks,
            ...addedTracks.map((t) => ({
              ...t,
              sort_index: updatedTrackMap.get(t.relation_id) || t.sort_index,
            })),
          ].sort(
            (b, a) =>
              (updatedTrackMap.get(a.relation_id) || a.sort_index) -
              (updatedTrackMap.get(b.relation_id) || b.sort_index)
          );

          const newSections = sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  playlists: section.playlists.map((p: any) =>
                    p.id === data.originalPlaylist.id
                      ? {
                          ...p,
                          ...results[0].data,
                          tracks: allTracks,
                        }
                      : p
                  ),
                }
              : section
          );
          updateSectionsWithAPI(newSections);
        });
      } else {
        // Handle new playlist creation
        addPlaylist(
          {
            data: data.playlist, // FormData object, don't spread
          },
          {
            onSuccess: (playlistData) => {
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
                  onSuccess: (trackData) => {
                    const newSections = sections.map((section) =>
                      section.id === sectionId
                        ? {
                            ...section,
                            playlists: [
                              ...section.playlists,
                              {
                                ...playlistData.data,
                                tracks: trackData.data || [],
                              },
                            ],
                          }
                        : section
                    );
                    updateSectionsWithAPI(newSections);
                  },
                }
              );
            },
          }
        );
      }
    }
    setPlaylistAddVisible(["", ""]);
  };

  const renderSection = (section: Partial<SectionProps>) => {
    const handleUpdate = (updates: Partial<SectionProps>) => {
      updateSection(section?.id || "", updates);
    };
    const handleDelete = () => {
      deleteSection(section?.id || "");
    };

    return (
      <SortableSection
        key={section.id || ""}
        title={section.title || ""}
        subtitle={section.subtitle || ""}
        id={section.id || ""}
        playlists={section.playlists || []}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        showPlaylistAddModal={showPlaylistAddModal.bind(null, section.id || "")}
        showSearchPlaylistModal={setSearchPlaylistVisible.bind(
          null,
          section.id || ""
        )}
      />
    );
  };

  const openPlaylistsPage = () => {
    router.push("/playlists");
  };

  const handleSearchPlaylistClose = (
    sectionId: string,
    playlist?: GeneralObject
  ) => {
    if (isValidObject(playlist) && sectionId) {
      const isDynamic = seedData?.dynamic_playlists?.includes(playlist?.id);
      const newSections = sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              playlists: [...section.playlists, { ...playlist, isDynamic }],
            }
          : section
      );
      updateSectionsWithAPI(newSections);
    }
    setSearchPlaylistVisible("");
  };

  return (
    <Page>
      <PageHeader
        title="Zostel Home"
        breadcrumbs={[
          { name: "Zostel Home", id: "zostel-home", url: "/zostel-home" },
        ]}
        rightOptions={
          <Button onClick={openPlaylistsPage}>View All Playlists</Button>
        }
      />
      <PageContent>
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <Spin size="large" />
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id || "")}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-4 w-full">
              {sections.map(renderSection)}
              <Button
                className="self-center"
                onClick={addSection}
                icon={<AddIcon />}
              >
                Section
              </Button>
            </div>
          </SortableContext>
        </DndContext>
        <AddPlaylistSidebar
          isOpen={isPlaylistAddVisible}
          onClose={handlePlaylistClose}
        />
        <SearchPlaylistSidebar
          isOpen={isSearchPlaylistVisible}
          onClose={handleSearchPlaylistClose}
        />
      </PageContent>
    </Page>
  );
};

const SortableSection = (props: SectionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.id,
      transition: {
        duration: 150, // Shorter duration for smoother movement
        easing: "cubic-bezier(0.25, 1, 0.5, 1)", // Custom easing function for smoother acceleration/deceleration
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none", // Prevent touch scrolling while dragging
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Section
        {...props}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
};

const Section: React.FC<
  SectionProps & {
    dragAttributes?: any;
    dragListeners?: any;
  }
> = ({
  id,
  title,
  subtitle,
  playlists,
  onUpdate,
  onDelete,
  showPlaylistAddModal,
  showSearchPlaylistModal,
  dragAttributes,
  dragListeners,
}) => {
  const [isEditingTitle, setEditingTitle] = useState<boolean>(false);
  const [isEditingSubtitle, setEditingSubtitle] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editSubtitle, setEditSubtitle] = useState(subtitle);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = playlists.findIndex((item) => item.id === active.id);
      const newIndex = playlists.findIndex((item) => item.id === over.id);
      onUpdate?.({
        playlists: arrayMove(playlists, oldIndex, newIndex),
      });
    }
  };

  const deletePlaylist = (playlistId: string) => {
    onUpdate?.({
      playlists: playlists.filter((p) => p.id !== playlistId),
    });
  };

  const handleTitleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onUpdate?.({ title: editTitle });
      setEditingTitle(false);
    }
  };

  const handleSubtitleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onUpdate?.({ subtitle: editSubtitle });
      setEditingSubtitle(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditSubtitle(e.target.value);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
  };

  const handleSubtitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubtitle(true);
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
  };

  const handleSubtitleBlur = () => {
    setEditingSubtitle(false);
  };

  const renderPlaylist = (playlist: PlaylistProps) => (
    <SortablePlaylist
      key={playlist.id}
      {...playlist}
      onDelete={() => deletePlaylist(playlist.id)}
      editPlaylist={() => showPlaylistAddModal(playlist.id)}
    />
  );

  return (
    <div className="w-full flex flex-col items-start border p-4 gap-4 border-zui-light relative">
      <div className="absolute top-2 right-2">
        <Popconfirm
          title="Are you sure you want to delete this section?"
          onConfirm={onDelete}
          okText="Yes"
          cancelText="No"
        >
          <Button danger type="link" icon={<DeleteOutlineIcon />} />
        </Popconfirm>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          icon={<DragIndicatorIcon />}
          {...dragAttributes}
          {...dragListeners}
        />
        {isEditingTitle ? (
          <Input
            showCount
            maxLength={20}
            className="w-96"
            size="large"
            value={editTitle}
            onChange={handleTitleChange}
            onKeyDown={handleTitleSubmit}
            onBlur={handleTitleBlur}
            autoFocus
          />
        ) : isValidString(title) ? (
          <span
            className="text-xl font-medium cursor-pointer"
            onClick={handleTitleClick}
          >
            {title}
          </span>
        ) : (
          <span
            className="text-xl font-medium text-zui-silver cursor-pointer"
            onClick={handleTitleClick}
          >
            Add Title
          </span>
        )}
        {isEditingSubtitle ? (
          <Input
            showCount
            maxLength={40}
            className="w-96"
            size="small"
            value={editSubtitle}
            onChange={handleSubtitleChange}
            onKeyDown={handleSubtitleSubmit}
            onBlur={handleSubtitleBlur}
            autoFocus
          />
        ) : isValidString(subtitle) ? (
          <span
            className="text-sm cursor-pointer"
            onClick={handleSubtitleClick}
          >
            {subtitle}
          </span>
        ) : (
          <span
            className="text-sm text-zui-silver cursor-pointer"
            onClick={handleSubtitleClick}
          >
            Add Subtitle
          </span>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={playlists.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4 w-full">
            {playlists.map(renderPlaylist)}

            <div className="flex items-center justify-center gap-2">
              <Button
                className="self-center"
                onClick={() => showPlaylistAddModal()}
                icon={<AddIcon />}
              >
                Playlist
              </Button>
              <Button
                type="text"
                className="self-center"
                onClick={showSearchPlaylistModal}
              >
                Choose from existing playlists
              </Button>
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const SortablePlaylist = (props: PlaylistProps & { onDelete?: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.id,
      transition: {
        duration: 150, // Shorter duration for smoother movement
        easing: "cubic-bezier(0.25, 1, 0.5, 1)", // Custom easing function for smoother acceleration/deceleration
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none", // Prevent touch scrolling while dragging
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Playlist
        {...props}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
};

const Playlist: React.FC<
  PlaylistProps & {
    dragAttributes?: any;
    dragListeners?: any;
    onDelete?: () => void;
  }
> = ({
  id,
  title,
  subtitle,
  dragAttributes,
  isDynamic,
  dragListeners,
  onDelete,
  tracks,
  editPlaylist,
}) => {
  return (
    <div className="flex w-full border border-zui-light relative">
      <div className="w-48 min-h-[128px] flex-shrink-0 bg-zui-light relative">
        <div className="absolute top-2 right-2">
          <Button
            icon={<DragIndicatorIcon />}
            {...dragAttributes}
            {...dragListeners}
          />
        </div>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {!isDynamic && (
          <Button
            type="link"
            icon={<EditOutlinedIcon />}
            onClick={editPlaylist}
          />
        )}
        <Popconfirm
          title="Are you sure you want to remove this playlist from this section?"
          description="This won't delete the playlist, just remove it from this section."
          onConfirm={onDelete}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" danger icon={<DeleteOutlineIcon />} />
        </Popconfirm>
      </div>
      {isDynamic ? (
        <div className="flex flex-col gap-2 p-4">
          <span className="text-lg font-medium">
            {formatCapitalize(String(id))}
          </span>
          <Tag color="purple" className="self-start">
            ✨ Dynamic
          </Tag>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-4">
          {isValidString(title) ? (
            <span className="text-lg font-medium">{title}</span>
          ) : (
            <span className="text-lg font-medium text-zui-silver">
              No Title
            </span>
          )}
          {isValidString(subtitle) ? (
            <span className="text-sm">{subtitle}</span>
          ) : (
            <span className="text-sm text-zui-silver">No Subtitle</span>
          )}
          <span className="overflow-ellipsis">
            {tracks.map((t) => t.track_data.title).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlaylistAdmin;
