import { CloudUploadOutlined } from "@ant-design/icons";
import { cn } from "@zo/utils/font";
import { Alert, Flex, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { AllowedFileType } from "libs/moal/src/ui/FormElement/FileUpload";
import { ZudMediaUploadSidebar } from "@zo/zud";
import { isImageUri } from "@zo/utils/string";

interface CASMediaType {
  id: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
  metadata: {
    aspectRatio: number;
    alt: string;
    description: string;
    title: string;
  };
}

interface MediaPickerProps {
  value: CASMediaType | File | FormData;
  setValue: (value: File | FormData) => void;
  placeholder?: string;
  disabled?: boolean;
  allowedFileTypes?: AllowedFileType[];
  maxSize?: number;
  label?: string;
  allowMultiple?: boolean;
  mediaKey?: string;
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  value,
  setValue,
  placeholder,
  disabled,
  allowedFileTypes = ["image", "video", "document"],
  maxSize = 5, // MB
  allowMultiple = false,
  mediaKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value && value instanceof FormData) {
      const media = value.get("file");
      if (media) {
        setPreviewUrl(URL.createObjectURL(media as Blob));
      }
    }

    if (value && typeof value === "string") {
      setPreviewUrl(value);
    }

    if (value && typeof value === "object" && "url" in value) {
      setPreviewUrl(value.url);
    }
  }, [value]);
  
  return (
    <>
      {value ? (
        <div
          role="button"
          onClick={!disabled ? setIsOpen.bind(null, true) : undefined}
          className="w-full h-[180px] group"
        >
          <div className="flex items-center justify-center h-full w-full absolute bg-black/60 invisible group-hover:visible transition-all duration-100">
            Click to Upload
          </div>

          {previewUrl ? (
            isImageUri(previewUrl) ? (
              <img
                src={previewUrl}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                muted
                autoPlay
                loop
                playsInline
                src={previewUrl}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <Alert message="Preview not available" showIcon type="info" />
          )}
        </div>
      ) : (
        <Flex
          className={cn(
            "h-[180px] flex flex-col items-center justify-center border border-dashed border-zui-lightest rounded-md hover:border-zui-primary cursor-pointer p-6",
            disabled && "cursor-not-allowed"
          )}
          onClick={!disabled ? setIsOpen.bind(null, true) : undefined}
        >
          <CloudUploadOutlined className="text-4xl text-zui-silver mb-4" />
          <Typography.Title level={5} className="text-zui-white mb-2">
            {placeholder || "Click to add media"}
          </Typography.Title>
          <Typography.Text className="text-zui-silver text-center">
            Supported file types: {allowedFileTypes.join(", ")}
          </Typography.Text>
        </Flex>
      )}
      <ZudMediaUploadSidebar
        isOpen={isOpen}
        onClose={setIsOpen.bind(null, false)}
        onUpload={(formData: FormData) => setValue(formData)}
        allowedFileTypes={allowedFileTypes}
        maxSize={maxSize}
        mediaKey={mediaKey}
      />
    </>
  );
};

export default React.memo(MediaPicker);
