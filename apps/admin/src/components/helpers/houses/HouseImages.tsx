import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { Alert, App } from "antd";
import { Media, ZoHouse } from "apps/admin/src/config";
import React, { useState } from "react";
import { ImageUploaderSidebar } from "../../sidebars";
import { ImageGallery } from "../general";

interface HouseImagesProps {
  data: ZoHouse;
  refetch: () => void;
}

const HouseImages: React.FC<HouseImagesProps> = ({ data, refetch }) => {
  const { message } = App.useApp();
  const [isImagePickerVisible, showImagePicker, hideImagePicker] =
    useVisibilityState(false);

  const [media, setMedia] = useState<Media[]>(data?.media || []);
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
      formData.append(
        "sort_index",
        coverImage.sort_index ? coverImage.sort_index : String(media.length + 1)
      );
      formData.append(
        "metadata",
        JSON.stringify({
          alt: coverImage.alt,
          title: coverImage.title,
          description: coverImage.description,
          priority: coverImage.priority,
        })
      );

      uploadMedia(
        {
          data: formData,
          route: `operator/${data.id}/`,
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
    <>
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
      <ImageGallery
        relationtypeId={data.id}
        onUpload={showImagePicker}
        media={media}
        refetch={refetch}
        relationType="operator"
        setMedia={setMedia}
      />
      <ImageUploaderSidebar
        isOpen={isImagePickerVisible}
        onClose={hideImagePicker}
        onSave={handleSave}
      />
    </>
  );
};

export default HouseImages;
