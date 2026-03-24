import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader, useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { Breadcrumb, message, Spin, Typography } from "antd";
import BulkMediaUploadSidebar from "apps/admin/src/components/sidebars/BulkMediaUploadSidebar";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { copyTextToClipboard } from "../../../../../../libs/utils/string/src/lib/utils-string";
import { MediaUploadSidebar } from "../../../components/sidebars";
import { MediaCard } from "../../../components/ui";
import { CASMediaResponse } from "../../../config";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

interface MediaUploadProps {}

const MediaUpload: NextPage<MediaUploadProps> = () => {
  const router = useRouter();

  const [isMediaSidebarVisible, showMediaSidebar, hideMediaSidebar] =
    useVisibilityState();

  const [
    isBulkMediaSidebarVisible,
    showBulkMediaSidebar,
    hideBulkMediaSidebar,
  ] = useVisibilityState();

  const [data, setData] = useState<GeneralObject[]>([]);

  const { mutate: deleteMedia } = useMutationApi(
    "CAS_MEDIA",
    undefined,
    "",
    "DELETE"
  );

  const { isLoading, refetch } = useInfiniteTable({
    queryEndpoint: "CAS_MEDIA",
    name: "media",
    setter: setData,
    customSearchQuery: "ordering=-created_at",
  });

  const handleShowAddMedia = () => {
    showMediaSidebar();
    router.push("/misc/media-upload/new", undefined, { shallow: true });
  };

  const handleDeleteMedia = (mediaId: string) => {
    deleteMedia(
      {
        data: {},
        route: `${mediaId}/`,
      },
      {
        onSuccess() {
          message.success("Image Deleted");
          setData(data.filter((media) => media.id !== mediaId));
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleCopyMediaLink = (url: string) => {
    copyTextToClipboard(url);
    message.success("URL copied to clipboard");
  };

  const handleHideAddMedia = () => {
    hideMediaSidebar();
    router.replace("/misc/media-upload", undefined, { shallow: true });
  };

  // Memoize the media cards to prevent unnecessary re-renders
  const mediaCards = useMemo(() => {
    return data.map((media: GeneralObject, index: number) => (
      <MediaCard
        key={`${media.id}-${index}`}
        media={media as CASMediaResponse}
        onCopyMediaLink={handleCopyMediaLink}
        onDeleteMedia={handleDeleteMedia}
      />
    ));
  }, [data]);

  const handleUploadSuccess = (media: CASMediaResponse) => {
    setData([media, ...data]);
    hideBulkMediaSidebar();
  };

  useEffect(() => {
    if (
      isValidString(router.query.slug?.[0]) &&
      String(router.query.slug?.[0]) === "new"
    ) {
      showMediaSidebar();
    }

    if (
      isValidString(router.query.slug?.[0]) &&
      String(router.query.slug?.[0]) === "bulk-upload"
    ) {
      showBulkMediaSidebar();
    }
  }, [router.query.slug]);

  return (
    <Page>
      <Breadcrumb
        className="mb-4"
        items={[
          {
            title: (
              <Link href="/misc" shallow>
                Miscellaneous
              </Link>
            ),
          },
          {
            title: (
              <Link href="/misc/media-upload" shallow>
                Media
              </Link>
            ),
          },
        ]}
      />

      <PageHeader
        title="Media"
        buttons={[
          {
            label: "Add Media",
            icon: <AddOutlinedIcon />,
            onClick: handleShowAddMedia,
            type: "secondary",
          },
        ]}
      />
      <div className="py-10">
        {data.length > 0 && (
          <div className="flex flex-wrap gap-4">{mediaCards}</div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Spin />
          </div>
        )}
      </div>

      <MediaUploadSidebar
        isOpen={isMediaSidebarVisible}
        onClose={handleHideAddMedia}
        onUploadSuccess={handleUploadSuccess}
      />
      <BulkMediaUploadSidebar
        isOpen={isBulkMediaSidebarVisible}
        onClose={hideBulkMediaSidebar}
        onUploadSuccess={handleUploadSuccess}
      />
    </Page>
  );
};

export default MediaUpload;
