import { useQueryApi } from "@zo/auth";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { NextPage } from "next";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useVisibilityState } from "@zo/utils/hooks";
import { Zud, ZudColumnType, FormFieldType } from "@zo/zud";
import { MouseEventHandler, useState } from "react";
import { MediaGallerySidebar } from "../../components/sidebars";

const Destinations: NextPage = () => {
  const [isMediaGalleryVisible, showMediaGallery, hideMediaGallery] =
    useVisibilityState();
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);

  const handleViewGallery: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;

    if (id && isValidString(id)) {
      setSelectedDestinationId(id);
      showMediaGallery();
    }
  };

  const { data: destinationCount } = useQueryApi<number>("CAS_DESTINATIONS", {
    select: (data) => data.data.count,
  });

  const stats: { label: string; value: number }[] = [
    { label: "Total Destinations", value: destinationCount || 0 },
  ];

  const columns: ZudColumnType[] = [
    {
      title: "City",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (cell) => <span>{cell.name}</span>,
    },
    {
      title: "Twitter",
      dataIndex: "twitter_handle",
      key: "twitter_handle",
      render(cell, row) {
        return (
          cell && (
            <a
              target="_blank"
              className="flex items-center gap-2"
              href={cell ? `https://twitter.com/${cell}` : ""}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="underline">{String(cell)}</span>
              <OpenInNewOutlinedIcon fontSize="small" />
            </a>
          )
        );
      },
    },
    {
      title: "Media",
      dataIndex: "media",
      key: "media",
      render(cell, row) {
        return (
          <button
            className="hover:text-zui-neon"
            onClick={handleViewGallery}
            data-id={row?.id}
          >
            View Gallery
          </button>
        );
      },
    },
  ];

  const { data: timezoneOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.destination.timezones.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const formFields: FormFieldType[] = [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      name: "code",
      type: "text",
      label: "Code",
      required: true,
    },
    {
      name: "country",
      type: "searchselect",
      label: "Country",
      required: true,
      searchQueryApi: "CAS_COUNTRIES",
    },
    {
      name: "timezone",
      type: "select",
      label: "Time Zone",
      required: true,
      options: timezoneOptions,
    },
    {
      name: "email",
      type: "email",
      label: "Email",
    },
    {
      name: "twitter_handle",
      type: "text",
      label: "Twitter",
    },
    {
      name: "coordinates",
      type: "coordinates",
      label: "Coordinates",
      required: true,
    },
  ];

  return (
    <>
      <Zud
        name="destinations"
        title="Destinations"
        queryEndpoint="CAS_DESTINATIONS"
        mutationEndpoint="CAS_DESTINATIONS"
        columns={columns}
        formFields={formFields}
        customSearchQuery="ordering=name"
        stats={stats}
        searchable={true}
      />
      <MediaGallerySidebar
        isOpen={isMediaGalleryVisible}
        onClose={hideMediaGallery}
        relationTypeId={selectedDestinationId}
        relationType="destination"
        queryApi="CAS_DESTINATIONS"
      />
    </>
  );
};

export default Destinations;
