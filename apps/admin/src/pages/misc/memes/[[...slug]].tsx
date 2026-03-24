import { Loader } from "@zo/assets/lotties";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader, useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { App, Switch } from "antd";
import { memeConfig } from "apps/admin/src/config";
import { NextPage } from "next";
import { useState } from "react";
import { formatCapitalize } from "../../../../../../libs/utils/string/src/lib/utils-string";

interface MediaUploadProps {}

const MediaUpload: NextPage<MediaUploadProps> = () => {
  const [data, setData] = useState<GeneralObject[]>([]);
  const { message } = App.useApp();

  const { isLoading, refetch } = useInfiniteTable({
    queryEndpoint: "CAS_MEDIA",
    name: "media",
    additionalRoute: `meme/${memeConfig.SFMemeRelationId}/`,
    setter: setData,
    customSearchQuery: `ordering=-created_at`,
  });

  const { mutate: updateMedia } = useMutationApi("CAS_MEDIA", {}, "", "PUT");

  const handleStatusChange = (mediaRelationId: string, status: string) => {
    updateMedia(
      {
        data: {
          status: status === "active" ? "inactive" : "active",
        },
        route: `meme/${memeConfig.SFMemeRelationId}/${mediaRelationId}/`,
      },
      {
        onSuccess: (data) => {
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <Page
      breadCrumbs={[
        { href: "/misc", label: "Miscellaneous" },
        { href: "/misc/memes", label: "Memes" },
      ]}
    >
      <PageHeader title="Memes" />

      <div className="py-10 grid w-full grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4">
        {data.map((media) => {
          const isImage =
            media.url?.includes("png") ||
            media.url?.includes("jpg") ||
            media.url?.includes("jpeg") ||
            media.url?.includes("gif") ||
            media.url?.includes("blob");

          return (
            <div className="relative border border-zui-light">
              {isImage ? (
                <img
                  className="w-full aspect-square object-cover"
                  src={media.url}
                  alt={media.alt}
                />
              ) : (
                <video
                  className="w-full aspect-square object-cover"
                  autoPlay={true}
                  loop
                  muted
                  playsInline
                  src={media.url}
                />
              )}

              <div className="w-full flex items-center p-4 gap-4">
                <Switch
                  checked={media.status === "active"}
                  onChange={() =>
                    handleStatusChange(media.media_relation_id, media.status)
                  }
                />
                <span className="text-sm">
                  {formatCapitalize(media.status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {isLoading && <Loader className="w-10 h-10 mx-auto my-10" />}
    </Page>
  );
};

export default MediaUpload;
