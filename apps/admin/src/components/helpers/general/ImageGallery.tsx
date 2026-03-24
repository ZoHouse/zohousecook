import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import Icon from "@zo/assets/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import type { MenuProps } from "antd";
import { App, Button, Dropdown, Image, Spin, Tooltip } from "antd";
import { Media } from "apps/admin/src/config";
import React, { useState } from "react";
import { MediaGalleryEditSidebar } from "../../sidebars";

interface ImageGalleryProps {
  media?: Media[];
  relationtypeId: string;
  relationType: string;
  onUpload: () => void;
  refetch: () => void;
  setMedia: (media: Media[]) => void;
}

const sortMedia = (media: Media[]) =>
  media.sort((a, b) => b.sort_index - a.sort_index);

const ImageGallery: React.FC<ImageGalleryProps> = ({
  media = [],
  onUpload,
  relationtypeId,
  relationType,
  refetch,
  setMedia,
}) => {
  const { message } = App.useApp();

  const { mutate: updateMedia, isLoading: isUpdating } = useMutationApi(
    "CAS_MEDIA",
    {},
    "",
    "PUT"
  );
  const { mutate: deleteMedia, isLoading: isDeleting } = useMutationApi(
    "CAS_MEDIA",
    {},
    "",
    "DELETE"
  );

  const [isEditMediaSidebarOpen, showEditMediaSidebar, hideEditMediaSidebar] =
    useVisibilityState();
  const [selectedMedia, setSelectedMedia] = useState<GeneralObject>({});

  const handleMakeCoverImage = (imageId: string) => {
    const maxSortIndex = media.reduce((max, current) => {
      return current.sort_index > max ? current.sort_index : max;
    }, -Infinity);

    updateMedia(
      {
        data: { sort_index: maxSortIndex + 1 },
        route: `${imageId}/`,
      },
      {
        onSuccess(data) {
          message.success("Made cover image successfully");
          const newMediaData: Media = data.data;
          refetch();
          const _media = media.map((media: Media) =>
            media.id === imageId ? newMediaData : media
          );

          setMedia(_media);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleDeleteImage = (mediaId: string) => {
    deleteMedia(
      {
        data: {},
        route: `${relationType}/${relationtypeId}/${mediaId}/`,
      },
      {
        onSuccess() {
          message.success("Image deleted successfully");
          const _media = media.filter((m) => m.id !== mediaId);
          setMedia(_media);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleEdit = (media: Media) => {
    setSelectedMedia(media);
    showEditMediaSidebar();
  };

  const handleEditMediaSave = (data: GeneralObject, callback: () => void) => {
    const metadata = data.metadata;
    const mediaId = data.id;

    const formData = new FormData();
    formData.append("category", "image");
    formData.append("sort_index", data.sort_index);
    formData.append(
      "metadata",
      JSON.stringify({
        alt: metadata.alt,
        title: metadata.title,
        description: metadata.description,
      })
    );

    updateMedia(
      {
        data: formData,
        route: `${data.id}/`,
      },
      {
        onSuccess(data) {
          message.success("Image updated successfully");
          const newMediaData: Media = data.data;

          refetch();
          const _media = media.map((media: Media) =>
            media.id === mediaId ? newMediaData : media
          );

          setMedia(_media);
          callback();
          hideEditMediaSidebar();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <Spin size="large" spinning={isDeleting}>
      <div className="grid md:grid-cols-3 py-6 w-full md:w-3/4 gap-4">
        {media.length > 0 ? (
          sortMedia(media).map((image: Media, index: number) => {
            if (index === 0) {
              return (
                <div className="relative group md:col-span-3 aspect-video overflow-hidden">
                  <Spin spinning={isUpdating}>
                    <div className="absolute top-0 left-0 h-10 w-10 flex items-center justify-center bg-zui-dark/50 z-20">
                      {image.sort_index}
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                      <Tooltip title="Delete Image">
                        <div className="hidden group-hover:block bg-zui-dark/50">
                          <Button
                            onClick={() => handleDeleteImage(image.id)}
                            className="hidden group-hover:block bg-zui-dark/50 border-zui-white"
                            type="default"
                            ghost
                            icon={
                              <DeleteOutlined
                                style={{ fontSize: "20px", color: "white" }}
                              />
                            }
                          />
                        </div>
                      </Tooltip>
                      <Tooltip title="Edit Image">
                        <Button
                          onClick={() => handleEdit(image)}
                          className="hidden group-hover:block bg-white/50"
                          type="default"
                          ghost
                          icon={<EditOutlined style={{ fontSize: "20px" }} />}
                        />
                      </Tooltip>
                    </div>
                    <Image
                      className="object-cover w-full h-full"
                      src={`${image?.url}`}
                      alt={image?.metadata?.alt || "Cover Image"}
                      preview={true}
                    />
                  </Spin>
                </div>
              );
            } else {
              const items: MenuProps["items"] = [
                {
                  key: "1",
                  label: "Make Cover",
                  onClick: () => handleMakeCoverImage(image?.id),
                },
                {
                  key: "2",
                  label: "Delete",
                  onClick: () => handleDeleteImage(image?.id),
                },
                {
                  key: "3",
                  label: "Edit",
                  onClick: () => handleEdit(image),
                },
              ];

              return (
                <div className="group relative flex aspect-square items-center justify-center w-full h-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-6 w-6 flex items-center justify-center bg-zui-dark/50">
                    {image.sort_index}
                  </div>
                  <Dropdown
                    menu={{ items }}
                    placement="bottomRight"
                    trigger={["click"]}
                    className="hidden group-hover:block absolute top-2 right-2 z-20"
                  >
                    <Button
                      type="link"
                      icon={<Icon name="More" size={20} />}
                      className="bg-white/50 hover:bg-white/70"
                    />
                  </Dropdown>
                  <Image
                    className="w-full h-full object-cover"
                    src={`${image?.url}?w=300`}
                    alt={image?.metadata?.alt || `gallery-image ${index}`}
                    preview={true}
                    width={"100%"}
                    height={"100%"}
                  />
                </div>
              );
            }
          })
        ) : (
          <Button
            onClick={onUpload}
            type="dashed"
            className="md:col-span-3 h-[300px] min-h-fit aspect-video w-full"
          >
            <div className="flex flex-col items-center">
              <Icon name="Image" size={24} />
              <span>Drag or upload Image</span>
            </div>
          </Button>
        )}
        {media.length >= 1 && (
          <Tooltip title="Upload a new image">
            <Button
              onClick={onUpload}
              type="dashed"
              className="aspect-square h-full min-h-fit w-full"
            >
              <div className="flex flex-col items-center aspect-square">
                <Icon name="Plus" size={24} className="mx-auto" />
                <span className="mt-2">Add Image</span>
              </div>
            </Button>
          </Tooltip>
        )}
      </div>
      <MediaGalleryEditSidebar
        isOpen={isEditMediaSidebarOpen}
        onClose={hideEditMediaSidebar}
        data={selectedMedia}
        onSave={handleEditMediaSave}
      />
    </Spin>
  );
};

export default ImageGallery;
