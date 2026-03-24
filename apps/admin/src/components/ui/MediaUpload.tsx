import {
  DeleteOutlined,
  DragOutlined,
  InboxOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Upload } from "antd";
import { RcFile, UploadFile } from "antd/es/upload/interface";
import { showToast } from "libs/moal/src/utils";
import React, { useCallback, useEffect, useState } from "react";

const { Dragger } = Upload;

interface MediaUploadProps {
  pendingUploads: UploadFile<any>[];
  setPendingUploads: any;
  isUploading: boolean;
  uploadingFiles: { [key: string]: boolean };
  uploadProgress?: { [key: string]: number };
  maxVideoSizeMB?: number;
  requiredWidth?: number;
  requiredHeight?: number;
  hint?: string;
  validateFile?: (file: File) => Promise<void>;
  onRetryFile?: (file: UploadFile<any>) => void;
}

const MAX_VIDEO_SIZE_MB = 10;
const REQUIRED_WIDTH = 1080;
const REQUIRED_HEIGHT = 1920;

export const SortableUploadItem = ({
  file,
  index,
  onRemove,
  onRetry,
  isUploading,
}: {
  file: UploadFile<any>;
  index: number;
  onRemove: (uid: string) => void;
  onRetry?: (file: UploadFile<any>) => void;
  isUploading: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.uid,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.originFileObj) {
      const url = URL.createObjectURL(file.originFileObj);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file.originFileObj]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isVideo = file.type?.startsWith("video");

  const getFileName = (name: string) => {
    const extension = name.split(".").pop();
    const baseName = name.substring(0, name.lastIndexOf("."));
    const truncatedName =
      baseName.length > 10 ? baseName.substring(0, 15) : baseName;
    return `${truncatedName}${baseName.length > 10 ? "..." : ""}.${extension}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 p-2 border relative ${
        isDragging ? "opacity-50 bg-gray-100" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          role="button"
          aria-label="Drag to reorder"
          className="cursor-move text-gray-400 hover:text-gray-600"
        >
          <DragOutlined className="text-lg" />
        </div>
        <div className="w-16 h-16 overflow-hidden relative">
          {isVideo ? (
            <div className="relative w-full h-full">
              <video
                src={previewUrl || ""}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <PlayCircleOutlined className="text-white text-2xl" />
              </div>
            </div>
          ) : (
            <img
              src={previewUrl || ""}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium truncate">
                {getFileName(file.name)}
              </p>
              <p className="text-xs text-gray-500">
                {isVideo ? "Video" : "Image"} •{" "}
                {((file?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB
                {isUploading && " • Uploading..."}
              </p>
              {file.status === "error" && (
                <p className="text-xs text-red-500 mt-1">
                  {file.error?.toString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {file.status === "error" && onRetry && (
                <Button
                  type="text"
                  icon={<RetweetOutlined />}
                  onClick={() => onRetry(file)}
                  className="text-blue-500"
                  aria-label="Retry upload"
                />
              )}
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => onRemove(file.uid)}
                className="text-red-500"
                disabled={isUploading}
                aria-label="Remove file"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MediaUpload: React.FC<MediaUploadProps> = ({
  pendingUploads,
  setPendingUploads,
  isUploading,
  uploadingFiles,
  maxVideoSizeMB = MAX_VIDEO_SIZE_MB,
  requiredWidth = REQUIRED_WIDTH,
  requiredHeight = REQUIRED_HEIGHT,
  hint,
  validateFile,
  onRetryFile,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUploadChange = useCallback(
    async ({ fileList }: { fileList: UploadFile<any>[] }) => {
      const processedFiles: UploadFile<any>[] = [];

      for (const file of fileList) {
        try {
          if (validateFile) {
            await validateFile(file.originFileObj as File);
          }
          processedFiles.push({ ...file, status: "done", error: undefined });
        } catch (error) {
          processedFiles.push({
            ...file,
            status: "error",
            error: error as Error,
          });
          showToast("error", (error as Error).message);
        }
      }

      const uniqueFiles = processedFiles.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.uid === file.uid)
      );
      setPendingUploads(uniqueFiles);
    },
    [validateFile, setPendingUploads]
  );

  const handleUploadDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setPendingUploads((items: any) => {
      const oldIndex = items.findIndex((item: any) => item.uid === active.id);
      const newIndex = items.findIndex((item: any) => item.uid === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleRemoveFile = useCallback(
    (uid: string) => {
      setPendingUploads((prevFiles: any) =>
        prevFiles.filter((file: any) => file.uid !== uid)
      );
    },
    [setPendingUploads]
  );

  return (
    <div>
      <div className="h-56">
        <Dragger
          multiple
          listType="text"
          accept=".png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.webm"
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
          <p className="ant-upload-text">Click or drag files to upload</p>
          <p className="ant-upload-hint">
            {hint ||
              (validateFile
                ? "Supports images and videos. Custom validation rules apply."
                : "Supports images (PNG, JPG, GIF) and videos (MP4, MOV, WebM)")}
          </p>
        </Dragger>
      </div>

      {pendingUploads.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4>Selected Files (drag to reorder)</h4>
            <Button
              type="text"
              danger
              onClick={() => setPendingUploads([])}
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>
          {!isUploading && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleUploadDragEnd}
            >
              <SortableContext
                items={pendingUploads.map((file) => file.uid)}
                strategy={rectSortingStrategy}
              >
                {pendingUploads.map((file, index) => (
                  <SortableUploadItem
                    key={file.uid}
                    file={file}
                    index={index}
                    onRemove={handleRemoveFile}
                    onRetry={onRetryFile}
                    isUploading={uploadingFiles[file.uid]}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
