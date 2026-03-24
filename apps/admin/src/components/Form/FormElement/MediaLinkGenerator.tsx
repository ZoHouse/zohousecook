import { Close, CloudUpload } from "@mui/icons-material";
import {
  Button,
  Drawer,
  Input,
  message,
  Spin,
  Tooltip,
  Upload,
  UploadProps,
} from "antd";
import { RcFile } from "antd/es/upload/interface";
import React, { useEffect, useState } from "react";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useMutationApi } from "@zo/auth";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useVisibilityState } from "@zo/utils/hooks";

const { Dragger } = Upload;

interface Media {
  media_relation_id: string;
  status: string;
  id: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
  sort_index: number;
  metadata: {
    alt?: string;
    title?: string;
    description?: string;
    priority?: number;
  };
}

interface MediaLinkGeneratorProps {
  label: string;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
}

const MediaLinkGenerator: React.FC<MediaLinkGeneratorProps> = ({
  setValue,
  value,
  disabled,
}) => {
  const [isIconPickerVisible, showIconPicker, hideIconPicker] =
    useVisibilityState();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { mutate: uploadIcon, isLoading } = useMutationApi("CAS_MEDIA");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleSave = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", "image");
      formData.append("relation_type", "other");
      formData.append(
        "metadata",
        JSON.stringify({
          alt: selectedFile.name,
        })
      );

      uploadIcon(
        { data: formData },
        {
          onSuccess: (data) => {
            const iconData: Media = data.data;
            setValue(iconData.url);
            hideIconPicker();
          },
          onError: () => {
            message.error("An Error Occurred. Please Try Again.");
          },
        }
      );
    }
  };

  const draggerProps: UploadProps = {
    name: "file",
    multiple: false,
    onRemove: setSelectedFile.bind(null, null),
    beforeUpload: (file: File) => {
      setSelectedFile(file);
      return false;
    },
    showUploadList: false,
    fileList: selectedFile
      ? [
          {
            uid: selectedFile.name,
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            originFileObj: selectedFile as RcFile,
          },
        ]
      : [],
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    hideIconPicker();
  };

  return (
    <>
      <Input
        disabled={disabled}
        placeholder="Paste link here"
        size="large"
        value={value}
        allowClear
        onClear={() => setValue("")}
        suffix={
          <Tooltip title="Upload Media">
            <Button
              onClick={showIconPicker}
              type="text"
              icon={<CloudUpload sx={{ fontSize: 20 }} />}
            />
          </Tooltip>
        }
      />

      <Drawer
        title="Upload Media"
        onClose={handleClose}
        open={isIconPickerVisible}
        className="media-upload-drawer"
        extra={
          <Button
            onClick={handleSave}
            disabled={selectedFile == null}
            loading={isLoading}
            type="primary"
          >
            Save
          </Button>
        }
      >
        <Spin spinning={isLoading}>
          {selectedFile && previewUrl ? (
            <div className="h-80 flex flex-col items-center justify-center relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              <Button
                className="absolute top-2 right-2"
                icon={<Close />}
                onClick={() => setSelectedFile(null)}
                danger
                type="link"
              >
                Discard
              </Button>
            </div>
          ) : (
            <Dragger className="h-80 flex flex-col" {...draggerProps}>
              <div className="text-center px-8">
                <p className="text-6xl text-gray-400 mb-6">
                  <CloudUpload sx={{ fontSize: 72 }} />
                </p>
                <p className="text-xl font-medium text-white mb-3">
                  Click or drag the file to this area to upload
                </p>
                <p className="text-sm text-gray-400">
                  Support for images, videos, audio, and documents.
                  <br />
                  Max file size: 24MB
                </p>
              </div>
            </Dragger>
          )}
        </Spin>
      </Drawer>
    </>
  );
};

export default MediaLinkGenerator;