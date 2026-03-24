import { useMutationApi, useQueryApi } from "@zo/auth";
import { Form, FormElementType, SidebarMini } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormData } from "@zo/utils/hooks";
import { formatCapitalize } from "@zo/utils/string";
import { App } from "antd";
import React from "react";
import { useQueryClient } from "react-query";

interface MediaUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { formData, getFormValue, handleChange, resetFormData } = useFormData(
    {}
  );

  const { data: categoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    select: (data) =>
      data.data.gallery.media.category.map((category: string) => ({
        label: formatCapitalize(category),
        value: category,
      })),
  });

  const { mutate: uploadMedia } = useMutationApi("CAS_MEDIA");

  const handleClose = () => {
    resetFormData();
    onClose();
  };

  const handleSave = () => {
    const mediaData = new FormData();
    mediaData.append("file", formData.file);
    mediaData.append("category", formData.category);
    mediaData.append("metadata", JSON.stringify(formData.metadata));
    uploadMedia(
      { data: mediaData },
      {
        onSuccess() {
          message.success("Media Uploaded Successfully.");
          queryClient.invalidateQueries(["cas", "media"]);
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const formFields: FormElementType[] = [
    { label: "Media", name: "file", type: "file" },
    {
      label: "Category",
      name: "category",
      type: "select",
      options: categoryOptions,
    },
    { label: "Title", name: "metadata.title", type: "text" },
    { label: "Alt", name: "metadata.alt", type: "text", required: true },
    { label: "Description", name: "metadata.description", type: "textarea" },
  ];

  return (
    <SidebarMini
      isOpen={isOpen}
      onClose={handleClose}
      disableOutsideTapClose
      headerOptions={{ title: "Add a New Media", hasCloseButton: true }}
      footerOptions={{
        actionButtons: [{ label: "Save", onClick: handleSave }],
      }}
    >
      <Form
        formData={formData}
        formFields={formFields}
        handleChange={handleChange}
        getFormValue={getFormValue}
      />
    </SidebarMini>
  );
};

export default MediaUpload;
