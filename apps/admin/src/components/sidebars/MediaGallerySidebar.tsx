import { QueryEndpoints, useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { Alert, Drawer, message } from "antd";
import React, { useState } from "react";
import { ImageUploaderSidebar } from ".";
import { Media } from "../../config";
import { ImageGallery } from "../helpers/general";

interface MediaGallerySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  relationTypeId: string | null;
  relationType: string;
  queryApi: QueryEndpoints;
}

const MediaGallerySidebar: React.FC<MediaGallerySidebarProps> = ({
  relationTypeId,
  isOpen,
  onClose,
  relationType,
  queryApi,
}) => {
  const [media, setMedia] = useState<Media[]>([]);
  const { data, refetch } = useQueryApi<GeneralObject>(
    queryApi,
    {
      enabled: isValidString(relationTypeId),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
      onSuccess(data) {
        const _media = data.media;
        setMedia(_media);
      },
    },
    `${relationTypeId}/`
  );

  const [isImagePickerVisible, showImagePicker, hideImagePicker] =
    useVisibilityState(false);

  const { mutate: uploadMedia } = useMutationApi("CAS_MEDIA", {}, "", "POST");

  const handleSave = async (coverImage: any) => {
    if (coverImage) {
      if (!(coverImage.image instanceof File)) {
        message.warning("No Image Selected");
        return;
      }

      const formData = new FormData();
      formData.append("file", coverImage.image);
      formData.append("category", "image");
      formData.append("sort_index", coverImage.priority || 0);
      formData.append(
        "metadata",
        JSON.stringify({
          alt: coverImage.alt,
          title: coverImage.title,
          description: coverImage.description,
        })
      );

      uploadMedia(
        {
          data: formData,
          route: `${relationType}/${data?.id}/`,
        },
        {
          onSuccess(data) {
            message.success("Image Uploaded");
            setMedia((prev) => [...prev, data.data]);
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  };

  return (
    <Drawer size="large" title={data?.name} open={isOpen} onClose={onClose}>
      <Alert
        message={
          <span>
            <strong>Note: </strong>
            Images are sorted based on their priority (see top-left of the
            image). Larger number comes first.
          </span>
        }
        type="info"
        className="mt-4"
        showIcon
      />
      {relationTypeId && isValidString(relationTypeId) ? (
        <>
          <ImageGallery
            relationtypeId={relationTypeId}
            onUpload={showImagePicker}
            media={media}
            refetch={refetch}
            relationType={relationType}
            setMedia={setMedia}
          />
          <ImageUploaderSidebar
            isOpen={isImagePickerVisible}
            onClose={hideImagePicker}
            onSave={handleSave}
          />
        </>
      ) : (
        <div className="flex items-center justify-center my-20">
          <h3>No Images</h3>
        </div>
      )}
    </Drawer>
  );
};

export default MediaGallerySidebar;
