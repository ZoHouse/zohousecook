import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Card, Drawer, Input, Spin, Tag } from "antd";
import { useEffect, useRef, useState } from "react";

interface SearchPlaylistSidebarProps {
  isOpen: string;
  onClose: (sectionId: string, playlist?: GeneralObject) => void;
}

const dynamicPlaylistStatus = "✨ Dynamic";

const statusColors: GeneralObject = {
  active: "success",
  inactive: "default",
  unpublished: "warning",
  [dynamicPlaylistStatus]: "purple",
};

const SearchPlaylistSidebar: React.FC<SearchPlaylistSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState<string>("");
  const [isWatchingText, setWatchingText] = useState<boolean>(false);
  const { data: dynamicPlaylists } = useQueryApi<string[]>("CAS_SEED", {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    select: (data) => data.data.discover.home_page.dynamic_playlists,
  });
  const [selectedPlaylist, setSelectedPlaylist] = useState<
    GeneralObject | undefined
  >(undefined);

  const {
    data: tracks,
    isLoading,
    isFetching,
    isSuccess,
    remove: removeTracks,
  } = useQueryApi<GeneralObject[]>(
    "CAS_PLAYTRACKS",
    {
      enabled: isValidString(selectedPlaylist?.id),
      select: (data) => data.data,
    },
    "",
    `playlist=${selectedPlaylist?.id}&limit=-1`
  );

  const {
    data: playlist,
    isLoading: isPlaylistLoading,
    isFetching: isPlaylistFetching,
    remove: removePlaylist,
  } = useQueryApi<GeneralObject[]>(
    "CAS_PLAYLISTS",
    {
      enabled: isValidString(isOpen) && !isWatchingText,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
      select: (data) => [
        ...data.data,
        ...(dynamicPlaylists?.map((s) => ({
          title: s,
          id: s,
          status: dynamicPlaylistStatus,
        })) || []),
      ],
    },
    ``,
    `search=${search}&limit=-1`
  );

  const typingTimeout = useRef<any>(null);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (isValidString(text)) {
      setWatchingText(true);
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(async () => {
      setWatchingText(false);
    }, 1000);
  };

  const handlePlaylistClick = (playlist: GeneralObject) => {
    if (playlist.status !== dynamicPlaylistStatus) {
      setSelectedPlaylist(playlist);
    } else {
      onClose(isOpen, {
        id: playlist.id,
        tracks: [],
      });
    }
  };

  useEffect(() => {
    if (selectedPlaylist) {
      if (isSuccess) {
        onClose(isOpen, {
          ...selectedPlaylist,
          tracks,
        });
      }
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isOpen) {
      removePlaylist();
      removeTracks();
      setSelectedPlaylist(undefined);
      setSearch("");
      setWatchingText(false);
    }
  }, [isOpen]);

  return (
    <Drawer
      title="Search Playlist"
      placement="right"
      onClose={onClose.bind(null, isOpen, undefined)}
      open={isValidString(isOpen)}
      width={420}
    >
      {isLoading || isFetching ? (
        <div className="flex justify-center items-center h-24 w-full">
          <Spin />
        </div>
      ) : (
        <>
          <Input onChange={(e) => handleSearchChange(e.target.value)} />
          <div className="flex flex-col gap-2 mt-4">
            <p className="font-medium">Search Results</p>
            {isPlaylistFetching || isPlaylistLoading ? (
              <div className="flex justify-center items-center h-24 w-full">
                <Spin />
              </div>
            ) : (
              playlist?.map((playlist: GeneralObject) => (
                <Card
                  size="small"
                  key={playlist.id}
                  className="cursor-pointer"
                  onClick={() => handlePlaylistClick(playlist)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-row items-center gap-2">
                      <div className="flex flex-col">
                        <Tag
                          className="self-start mb-1"
                          color={statusColors[playlist.status]}
                        >
                          {playlist.status}
                        </Tag>
                        <div>
                          {playlist.status === dynamicPlaylistStatus
                            ? formatCapitalize(playlist.title)
                            : playlist.title}
                        </div>
                        <div className="text-xs text-zui-silver">
                          {playlist.structure}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </Drawer>
  );
};

export default SearchPlaylistSidebar;
