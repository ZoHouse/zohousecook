import {
  DeleteOutlined,
  FileOutlined,
  InboxOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, Form, Image, List, Spin, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const { Dragger } = Upload;

interface Document {
  url: string;
  name: string;
}

interface TripBatchDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: GeneralObject;
  batchId: string;
  onSuccess: () => void;
  documents: {
    documents?: Document[];
  };
}

const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv";

const TripBatchDocumentUpload: React.FC<TripBatchDocumentUploadProps> = ({
  isOpen,
  onClose,
  selectedDate,
  batchId,
  onSuccess,
  documents,
}) => {
  // Form instance
  const [form] = Form.useForm();

  // States
  const [pendingUploads, setPendingUploads] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Reset states when drawer closes
  const handleClose = () => {
    setPendingUploads([]);
    setIsUploading(false);
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    const urls = pendingUploads
      .filter((file) => file.type?.startsWith("image/"))
      .map((file) => URL.createObjectURL(file.originFileObj as Blob));

    return () => {
      urls.forEach(URL.revokeObjectURL);
    };
  }, [pendingUploads]);

  // API Hooks
  const { mutate: uploadDocuments } = useMutationApi("CAS_SKU", {}, "", "PUT");
  const { mutateAsync: uploadMedia } = useMutationApi("CAS_MEDIA");

  // Helper functions
  const isImageFile = (fileType: string) => fileType.startsWith("image/");

  const uploadFileToMedia = useCallback(
    async (file: File, fileType: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", isImageFile(fileType) ? "image" : "document");
      formData.append(
        "metadata",
        JSON.stringify({
          alt: file.name,
          name: file.name,
        })
      );

      try {
        const response = await uploadMedia(
          { data: formData },
          {
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );

        return response?.data?.url;
      } catch (error) {
        throw error;
      }
    },
    [uploadMedia]
  );

  // Memoized values
  const existingDocuments = useMemo(
    () => documents?.documents || [],
    [documents]
  );

  // Upload handlers
  const handleSingleFileUpload = useCallback(
    async (file: UploadFile) => {
      try {
        const fileUrl = await uploadFileToMedia(
          file.originFileObj as File,
          file.type || ""
        );

        if (fileUrl) {
          return {
            url: fileUrl,
            name: file.name,
          };
        }
      } catch (error) {
        message.error(`Failed to upload ${file.name} to media`);
      }
      return null;
    },
    [uploadFileToMedia]
  );

  const handleBulkUpload = async () => {
    if (pendingUploads.length === 0) {
      message.warning("Please select files to upload");
      return;
    }

    try {
      setIsUploading(true);

      // Upload all files to media
      const uploadPromises = pendingUploads.map(handleSingleFileUpload);
      const uploadResults = await Promise.all(uploadPromises);
      const uploadedDocuments = uploadResults.filter(
        (doc): doc is Document => doc !== null
      );

      if (uploadedDocuments.length > 0) {
        // Combine with existing documents
        const allDocuments = [...uploadedDocuments, ...existingDocuments];

        await uploadDocuments(
          {
            data: {
              data: { documents: allDocuments },
              slot: null,
            },
            route: `${batchId}/availability/${selectedDate.id}/`,
          },
          {
            onSuccess: () => {
              message.success("All files processed successfully");
              onSuccess();
              handleClose();
            },
            onError: (error) => {
              message.error(processResponseError(error));
            },
          }
        );
      }
    } catch (error) {
      message.error("Failed to process some files");
    } finally {
      setIsUploading(false);
    }
  };

  // UI Event handlers
  const handleUploadChange = useCallback(
    ({ fileList }: { fileList: UploadFile[] }) => {
      setPendingUploads(fileList);
    },
    []
  );

  const handleRemoveFile = useCallback((file: UploadFile) => {
    setPendingUploads((prev) => prev.filter((f) => f.uid !== file.uid));
  }, []);

  const FilePreview = useCallback(
    ({ file }: { file: UploadFile }) => {
      const isImage = file.type?.startsWith("image/");
      const fileUrl = isImage
        ? URL.createObjectURL(file.originFileObj as Blob)
        : undefined;

      return (
        <List.Item
          actions={[
            <Button
              key="delete"
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveFile(file)}
              disabled={isUploading}
            />,
          ]}
        >
          <List.Item.Meta
            avatar={
              <div className="flex items-center gap-3 p-2 max-w-xs">
                {isImage ? (
                  <Image
                    src={fileUrl}
                    alt={file.name}
                    width={40}
                    height={40}
                    style={{ objectFit: "cover" }}
                    preview={true}
                  />
                ) : (
                  <FileOutlined className="text-2xl text-zui-silver" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium" title={file.name}>
                    {file.name}
                  </div>
                </div>
              </div>
            }
          />
        </List.Item>
      );
    },
    [isUploading, handleRemoveFile]
  );

  return (
    <Drawer
      title="Upload Files"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={600}
      extra={
        <Button
          type="primary"
          onClick={handleBulkUpload}
          disabled={isUploading || pendingUploads.length === 0}
          icon={isUploading ? <LoadingOutlined /> : undefined}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      }
    >
      <Spin spinning={isUploading} tip="Uploading files...">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Files" tooltip="Supports images, documents">
            <Dragger
              multiple
              beforeUpload={() => false}
              onChange={handleUploadChange}
              fileList={pendingUploads}
              accept={ACCEPTED_FILE_TYPES}
            >
              <p className="text-4xl mb-4">
                <InboxOutlined />
              </p>
              <p className="text-base font-medium mb-2">
                Click or drag files to upload
              </p>
              <p className="text-sm text-zui-silver">
                Support for images, documents.
              </p>
            </Dragger>
          </Form.Item>
        </Form>
        {pendingUploads.length > 0 && (
          <List
            className="mt-4"
            itemLayout="horizontal"
            dataSource={pendingUploads}
            renderItem={(file) => <FilePreview file={file} />}
          />
        )}
      </Spin>
    </Drawer>
  );
};

export default TripBatchDocumentUpload;
