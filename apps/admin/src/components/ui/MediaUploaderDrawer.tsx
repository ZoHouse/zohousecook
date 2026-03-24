import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { App, Button, Drawer, UploadFile } from "antd";
import React, { useCallback, useState } from "react";
import { useQueryClient } from "react-query";

import {
  DeleteOutlined,
  InboxOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Upload } from "antd";
import { useEffect } from "react";

const { Dragger } = Upload;

interface MediaUploaderConfig {
  route: string;
  onSuccess?: (response: unknown) => void;
  onError?: (error: unknown) => void;
}

interface MediaUploaderDrawerProps {
  config: MediaUploaderConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const UploadItem = ({
  file,
  onRemove,
  isUploading,
}: {
  file: UploadFile;
  onRemove: (uid: string) => void;
  isUploading: boolean;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.originFileObj) {
      const url = URL.createObjectURL(file.originFileObj as File);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file.originFileObj]);

  const isVideo = file.type?.startsWith("video");

  return (
    <div className="relative w-24 h-24 overflow-hidden">
      {isVideo ? (
        <div className="relative w-full h-full">
          <video
            src={previewUrl || ""}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <PlayCircleOutlined className="text-white text-lg" />
          </div>
        </div>
      ) : (
        <img
          src={previewUrl || ""}
          alt={file.name as string}
          className="w-full h-full object-cover"
        />
      )}

      <Button
        type="text"
        icon={<DeleteOutlined />}
        onClick={() => onRemove(file.uid)}
        className="absolute top-1 right-1 text-red-500 bg-zui-dark  hover:bg-opacity-100 rounded-full w-6 h-6 flex items-center justify-center p-0"
        disabled={isUploading}
        aria-label="Remove file"
        size="small"
      />
    </div>
  );
};

export const MediaUploaderDrawer: React.FC<MediaUploaderDrawerProps> = ({
  config,
  isOpen,
  onClose,
}) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [pendingUploads, setPendingUploads] = useState<UploadFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: boolean;
  }>({});
  const [isUploading, setIsUploading] = useState(false);

  const { mutate: uploadMedia } = useMutationApi("CAS_MEDIA", {}, "", "POST");

  const handleUploadChange = useCallback(
    async ({ fileList }: { fileList: UploadFile[] }) => {
      const processedFiles: UploadFile[] = [];

      for (const file of fileList) {
        try {
          processedFiles.push({ ...file, status: "done", error: undefined });
        } catch (error) {
          processedFiles.push({
            ...file,
            status: "error",
            error: error as Error,
          });
        }
      }

      const uniqueFiles = processedFiles.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.uid === file.uid)
      );
      setPendingUploads(uniqueFiles);
    },
    []
  );

  const handleRemoveFile = useCallback((uid: string) => {
    setPendingUploads((prev) => prev.filter((file) => file.uid !== uid));
  }, []);

  const handleBulkUpload = useCallback(async () => {
    if (pendingUploads.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    const totalFiles = pendingUploads.length;
    const errors: Array<{ file: string; error: string }> = [];

    try {
      // Use the uploads in the order they were added
      const sortedUploads = [...pendingUploads];

      for (const [index, file] of sortedUploads.entries()) {
        try {
          setUploadingFiles((prev) => ({ ...prev, [file.uid]: true }));

          const formData = new FormData();

          // Add the file
          if (file.originFileObj) {
            formData.append("file", file.originFileObj);
          }

          // Always add category and metadata
          const isVideo = file.type?.startsWith("video");
          formData.append("category", isVideo ? "video" : "image");

          const metadata = {
            alt: file.name,
            title: file.name,
          };

          formData.append("metadata", JSON.stringify(metadata));

          await new Promise<void>((resolve) => {
            uploadMedia(
              {
                data: formData,
                route: config.route,
              },
              {
                onSuccess: (response) => {
                  successCount++;
                  setUploadingFiles((prev) => ({
                    ...prev,
                    [file.uid]: false,
                  }));
                  if (config.onSuccess) {
                    config.onSuccess(response);
                  }
                  queryClient.invalidateQueries(["cas", "media"]);
                  resolve();
                },
                onError: (error) => {
                  message.error(processResponseError(error));
                  setUploadingFiles((prev) => ({
                    ...prev,
                    [file.uid]: false,
                  }));
                  resolve();
                },
              }
            );
          });
        } catch (error) {
          message.error(processResponseError(error));
        }
      }

      if (successCount > 0) {
        if (errors.length > 0) {
          const errorMessage = `${successCount} of ${totalFiles} files uploaded. Errors: ${errors
            .map((e) => `${e.file}: ${e.error}`)
            .join("; ")}`;
          message.warning(errorMessage);
          onClose();
        } else {
          message.success("All files uploaded successfully");
          onClose();
        }
      }
    } catch (error) {
      message.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      setUploadingFiles({});
      setPendingUploads([]);
    }
  }, [pendingUploads, config, uploadMedia, queryClient, message, onClose]);
  return (
    <>
      <Drawer
        title="Upload Media Files"
        placement="right"
        width={520}
        onClose={onClose}
        open={isOpen}
        extra={
          <Button
            type="primary"
            onClick={handleBulkUpload}
            loading={isUploading}
          >
            Upload All ({pendingUploads.length})
          </Button>
        }
      >
        <div>
          <div className="h-56">
            <Dragger
              multiple
              listType="text"
              fileList={pendingUploads}
              onChange={handleUploadChange}
              beforeUpload={() => false}
              className="mb-6"
              disabled={isUploading}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>Click or drag files to upload</p>
              <p className="text-zui-silver">
                Supports images (PNG, JPG, GIF) and videos (MP4, MOV, WebM)
              </p>
            </Dragger>
          </div>

          {pendingUploads.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4>Selected Files</h4>
                <div className="flex gap-2">
                  <Button
                    type="text"
                    danger
                    onClick={() => setPendingUploads([])}
                    disabled={isUploading}
                    size="small"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              {!isUploading && (
                <div className="grid grid-cols-4 gap-4">
                  {pendingUploads.map((file) => (
                    <UploadItem
                      key={file.uid}
                      file={file}
                      onRemove={handleRemoveFile}
                      isUploading={uploadingFiles[file.uid]}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default MediaUploaderDrawer;
