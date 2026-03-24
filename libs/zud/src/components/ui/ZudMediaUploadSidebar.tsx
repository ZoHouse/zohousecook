// eslint-disable-next-line @nx/enforce-module-boundaries
import { useQueryApi } from "@zo/auth";

import { InboxOutlined } from "@ant-design/icons";
import { formatCapitalize } from "@zo/utils/string";
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Spin,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import React, { useEffect, useState } from "react";
import { DeleteOutlined } from "@mui/icons-material";
import { AllowedFileType } from "../form/definitions";

const { TextArea } = Input;
const { Dragger } = Upload;

interface ZudMediaUploadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => void;
  allowedFileTypes?: AllowedFileType[];
  maxSize?: number;
  mediaKey?: string;
}

type MediaTypeKey = keyof typeof MEDIA_TYPES;
const MEDIA_TYPES = {
  image: {
    accept: "image/*",
    category: "image",
  },
  video: {
    accept: "video/*",
    category: "video",
  },
  audio: {
    accept: "audio/*",
    category: "audio",
  },
  document: {
    accept: ".pdf,.doc,.docx,.txt,.rtf",
    category: "document",
  },
};

const ZudMediaUploadSidebar: React.FC<ZudMediaUploadSidebarProps> = ({
  isOpen,
  onClose,
  onUpload,
  allowedFileTypes = ["image", "video", "document"],
  maxSize = 24, // MB
  mediaKey,
}) => {
  const [form] = Form.useForm();

  const [selectedMedia, setSelectedMedia] = useState<UploadFile | null>(null);
  const [mediaType, setMediaType] = useState<MediaTypeKey | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: categoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    select: (data) =>
      data.data.gallery.media.category.map((category: string) => ({
        label: formatCapitalize(category),
        value: category,
      })),
  });

  useEffect(() => {
    if (selectedMedia && mediaType) {
      if (selectedMedia && selectedMedia instanceof File) {
        setPreviewUrl(URL.createObjectURL(selectedMedia as File));
      } else {
        setPreviewUrl(null);
      }

      const fileName = (selectedMedia as UploadFile).name
        .split(".")
        .slice(0, -1)
        .join(".");

      form.setFieldsValue({
        category: MEDIA_TYPES[mediaType].category,
        title: fileName,
        alt: fileName,
      });
    }
  }, [selectedMedia, mediaType, form]);

  const handleClose = () => {
    form.resetFields();
    setSelectedMedia(null);
    setMediaType(null);
    onClose();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedMedia) {
        message.error("Please select files to upload");
        return;
      }

      const mediaData = new FormData();

      // Ensure the file is valid and has the correct properties
      if (!selectedMedia || !(selectedMedia instanceof File)) {
        throw new Error(
          `Invalid file object for ${selectedMedia.name}. Please try uploading the file again.`
        );
      }

      mediaData.append("file", selectedMedia);
      mediaData.append("category", values.category);

      const fileName = selectedMedia.name.split(".").slice(0, -1).join(".");
      const altText = values.alt || fileName;

      if (mediaKey) {
        mediaData.append("media_key", mediaKey);
      }

      mediaData.append(
        "metadata",
        JSON.stringify({
          title: values.title || fileName,
          alt: altText,
          description: values.description,
        })
      );

      onUpload(mediaData);
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      message.error(`Validation failed: ${errorMessage}`);
      console.error("Validation failed:", error);
    }
  };

  const determineFileType = (file: UploadFile): MediaTypeKey | null => {
    if (file.type?.startsWith("image/")) return "image";
    if (file.type?.startsWith("video/")) return "video";
    if (file.type?.startsWith("audio/")) return "audio";
    if (
      file.type?.includes("pdf") ||
      file.type?.includes("doc") ||
      file.type?.includes("text") ||
      file.type?.includes("zip")
    )
      return "document";
    return null;
  };

  const handleRemove = () => {
    setSelectedMedia(null);
    setPreviewUrl(null);
    setMediaType(null);
    form.resetFields();
  };

  const draggerProps = {
    name: "file",
    multiple: true,
    fileList: false,
    onRemove: handleRemove,
    beforeUpload: (file: UploadFile) => {
      const fileType = determineFileType(file);

      if (!fileType) {
        message.error("Unsupported file type!");
        return Upload.LIST_IGNORE;
      }

      if (!fileType) {
        message.error("Unsupported file type!");
        return Upload.LIST_IGNORE;
      }

      if (!allowedFileTypes.includes(fileType as AllowedFileType)) {
        message.error(
          `You can only upload ${allowedFileTypes.join(
            ", "
          )} files in one batch!`
        );
        return Upload.LIST_IGNORE;
      }

      const isLessThanMaxSize = file.size
        ? file.size / 1024 / 1024 < maxSize
        : false;
      if (!isLessThanMaxSize) {
        message.error(`File must be smaller than ${maxSize}MB!`);
        return Upload.LIST_IGNORE;
      }

      if (!mediaType) {
        setMediaType(fileType);
      }

      setSelectedMedia(file);
      return false;
    },
  };

  return (
    <Drawer
      title="Add New Media"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={400}
      extra={
        <Button type="primary" onClick={handleSave} disabled={!selectedMedia}>
          Save
        </Button>
      }
    >
      <Spin spinning={false} tip="Uploading media...">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Media"
            tooltip="Supports images, videos, audio, and documents up to 24MB"
          >
            {previewUrl ? (
              <div className="h-60 relative">
                <Button
                  className="absolute top-2 right-2"
                  icon={<DeleteOutlined />}
                  onClick={handleRemove}
                ></Button>
                <img
                  src={previewUrl}
                  alt="Media Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Dragger
                className="h-60"
                {...{
                  ...draggerProps,
                  fileList: [],
                }}
                accept={
                  mediaType
                    ? MEDIA_TYPES[mediaType].accept
                    : Object.values(MEDIA_TYPES)
                        .map((t) => t.accept)
                        .join(",")
                }
              >
                <p className="text-6xl text-zui-silver mb-4">
                  <InboxOutlined />
                </p>
                <p className="text-lg font-medium text-zui-white mb-2">
                  Click or drag files to this area to upload
                </p>
                <p className="text-sm text-zui-silver">
                  {mediaType
                    ? `Currently uploading ${mediaType}s only. Max file size: 24MB`
                    : "Support for images, videos, audio, and documents. Max file size: 24MB"}
                </p>
              </Dragger>
            )}
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              size="large"
              placeholder="Select a category"
              options={categoryOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="title" label="Title">
            <Input
              size="large"
              placeholder="Enter media title (optional)"
              maxLength={100}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="alt"
            label="Alt Text"
            tooltip="Alternative text for accessibility. Defaults to filename if not provided"
          >
            <Input
              size="large"
              placeholder="Enter alt text (optional)"
              maxLength={200}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              size="large"
              placeholder="Enter media description"
              rows={4}
              maxLength={150}
              showCount
            />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default ZudMediaUploadSidebar;
