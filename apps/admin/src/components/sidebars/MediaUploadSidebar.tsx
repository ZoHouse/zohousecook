import {
  CloseOutlined,
  InboxOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize } from "@zo/utils/string";
import {
  Alert,
  Button,
  Collapse,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Slider,
  Spin,
  Switch,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import React, { useEffect, useState } from "react";
import { CASMediaResponse } from "../../config";

// Only import watermark on client-side
let watermark: any;
if (typeof window !== "undefined") {
  watermark = require("watermarkjs");
}

const { TextArea } = Input;
const { Dragger } = Upload;

interface MediaUploadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (data: CASMediaResponse) => void;
}

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

type MediaTypeKey = keyof typeof MEDIA_TYPES;

interface WatermarkPreset {
  label: string;
  value: string;
  url: string;
}

interface WatermarkSettings {
  enabled: boolean;
  image: File | null;
  padding: number;
  opacity: number;
  position: WatermarkPosition;
  scale: number;
  preset: string;
}

type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const WATERMARK_PRESETS: WatermarkPreset[] = [
  { label: "Custom Upload", value: "custom", url: "" },
  {
    label: "Zo Symbol Black",
    value: "Zo Symbol Black",
    url: "https://cdn.zo.xyz/gallery/media/images/2f26ca92-f4a5-47f8-b856-66f3da2e6a08_20241128083631.svg",
  },
  {
    label: "Zo Symbol White",
    value: "Zo Symbol White",
    url: "https://cdn.zo.xyz/gallery/media/images/8e3c4c56-e8d9-4e4d-900c-1910d5ebe4e1_20241128083645.svg",
  },
  {
    label: "Zo Trips",
    value: "Zo Trips",
    url: "https://cdn.zo.xyz/gallery/media/images/143530ca-8644-407e-a51b-c758990d0589_20241128083656.svg",
  },
  {
    label: "Zostel",
    value: "zostel",
    url: "https://cdn.zo.xyz/gallery/media/images/46bc5ba2-ee99-4158-a804-2fa2589e664b_20241128083835.svg",
  },
  {
    label: "Zostel Homes",
    value: "zostelHomes",
    url: "https://cdn.zo.xyz/gallery/media/images/5a5061d8-3830-423e-a382-4c98a876b367_20241128083708.svg",
  },
  {
    label: "Zostel Plus",
    value: "Zostel Plus",
    url: "https://cdn.zo.xyz/gallery/media/images/b852aa5f-e88c-47ed-94aa-00df635ce406_20241128083722.svg",
  },
];

const MediaUploadSidebar: React.FC<MediaUploadSidebarProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [form] = Form.useForm();

  const [selectedMedia, setSelectedMedia] = useState<UploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState<MediaTypeKey | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update watermark settings state
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>(
    {
      enabled: false,
      image: null,
      padding: 10,
      opacity: 0.5,
      position: "bottom-right",
      scale: 1,
      preset: "custom",
    }
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

  const { mutate: uploadMedia, isLoading } = useMutationApi("CAS_MEDIA");

  useEffect(() => {
    if (selectedMedia && mediaType) {
      setPreviewUrl(URL.createObjectURL(selectedMedia as unknown as File));

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
    setWatermarkSettings({
      enabled: false,
      image: null,
      padding: 10,
      opacity: 0.5,
      position: "bottom-right",
      scale: 1,
      preset: "custom",
    });
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

      setUploading(true);

      const mediaData = new FormData();

      // Ensure the file is valid and has the correct properties
      if (!selectedMedia || !(selectedMedia instanceof File)) {
        throw new Error(
          `Invalid file object for ${selectedMedia.name}. Please try uploading the file again.`
        );
      }

      const watermarkedFile = await applyWatermark(selectedMedia);

      mediaData.append("file", watermarkedFile);
      mediaData.append("category", values.category);

      const fileName = selectedMedia.name.split(".").slice(0, -1).join(".");
      const altText = values.alt || fileName;

      mediaData.append(
        "metadata",
        JSON.stringify({
          title: values.title || fileName,
          alt: altText,
          description: values.description,
        })
      );

      return uploadMedia(
        { data: mediaData },
        {
          onError(error) {
            message.error(
              `Failed to upload ${selectedMedia.name}: ${processResponseError(
                error
              )}`
            );
          },
          onSuccess(data) {
            onUploadSuccess(data.data);
            message.success(
              `Successfully uploaded ${selectedMedia.name} with id ${data.data.id}`
            );
            handleClose();
          },
        }
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      message.error(`Validation failed: ${errorMessage}`);
      console.error("Validation failed:", error);
    } finally {
      setUploading(false);
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

  const draggerProps = {
    name: "file",
    multiple: true,
    fileList: false,
    onRemove: (file: UploadFile) => {
      setSelectedMedia(null);
      if (!selectedMedia) {
        setMediaType(null);
      }
    },
    beforeUpload: (file: UploadFile) => {
      const fileType = determineFileType(file);

      if (!fileType) {
        message.error("Unsupported file type!");
        return Upload.LIST_IGNORE;
      }

      if (mediaType && fileType !== mediaType) {
        message.error(`You can only upload ${mediaType} files in one batch!`);
        return Upload.LIST_IGNORE;
      }

      const isLessThan24MB = file.size ? file.size / 1024 / 1024 < 24 : false;
      if (!isLessThan24MB) {
        message.error("File must be smaller than 24MB!");
        return Upload.LIST_IGNORE;
      }

      if (!mediaType) {
        setMediaType(fileType);
      }

      setSelectedMedia(file);
      return false;
    },
  };

  // Add watermark image upload handler
  const handleWatermarkUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      message.error("Please upload an image file for watermark");
      return false;
    }

    const isLessThan2MB = file.size / 1024 / 1024 < 2;
    if (!isLessThan2MB) {
      message.error("Watermark image must be smaller than 2MB");
      return false;
    }

    setWatermarkSettings((prev) => ({ ...prev, image: file }));
    return false; // Prevent default upload behavior
  };

  // Add this helper function
  const loadSvgAsImage = async (
    svg: File | string
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;

      if (typeof svg === "string") {
        img.src = svg;
      } else {
        img.src = URL.createObjectURL(svg);
      }
    });
  };

  // Update applyWatermark function to use image
  const applyWatermark = async (file: File): Promise<File> => {
    if (
      !watermarkSettings.enabled ||
      !watermarkSettings.image ||
      !file.type.startsWith("image/") ||
      typeof window === "undefined" ||
      !watermark
    ) {
      return file;
    }

    // Helper function to load an image from a File
    const loadImage = async (file: File): Promise<HTMLImageElement> => {
      if (file.type === "image/svg+xml") {
        return loadSvgAsImage(file);
      }
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    };

    try {
      // Load both images
      const [mainImg, watermarkImg] = await Promise.all([
        loadImage(file),
        loadImage(watermarkSettings.image),
      ]);

      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not get canvas context");
        }

        // Set canvas size to match main image
        canvas.width = mainImg.width;
        canvas.height = mainImg.height;

        // Draw main image
        ctx.drawImage(mainImg, 0, 0);
        const watermarkWidth = watermarkImg.width * watermarkSettings.scale;
        const watermarkHeight = watermarkImg.height * watermarkSettings.scale;

        // Calculate position based on selection
        let x = 0,
          y = 0;
        switch (watermarkSettings.position) {
          case "top-left":
            x = watermarkSettings.padding;
            y = watermarkSettings.padding;
            break;
          case "top-center":
            x = (canvas.width - watermarkWidth) / 2;
            y = watermarkSettings.padding;
            break;
          case "top-right":
            x = canvas.width - watermarkWidth - watermarkSettings.padding;
            y = watermarkSettings.padding;
            break;
          case "center-left":
            x = watermarkSettings.padding;
            y = (canvas.height - watermarkHeight) / 2;
            break;
          case "center":
            x = (canvas.width - watermarkWidth) / 2;
            y = (canvas.height - watermarkHeight) / 2;
            break;
          case "center-right":
            x = canvas.width - watermarkWidth - watermarkSettings.padding;
            y = (canvas.height - watermarkHeight) / 2;
            break;
          case "bottom-left":
            x = watermarkSettings.padding;
            y = canvas.height - watermarkHeight - watermarkSettings.padding;
            break;
          case "bottom-center":
            x = (canvas.width - watermarkWidth) / 2;
            y = canvas.height - watermarkHeight - watermarkSettings.padding;
            break;
          case "bottom-right":
            x = canvas.width - watermarkWidth - watermarkSettings.padding;
            y = canvas.height - watermarkHeight - watermarkSettings.padding;
            break;
          default:
            x = (canvas.width - watermarkWidth) / 2;
            y = (canvas.height - watermarkHeight) / 2;
        }

        // Set opacity
        ctx.globalAlpha = watermarkSettings.opacity;

        // Draw watermark
        ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const watermarkedFile = new File([blob], file.name, {
              type: file.type,
            });
            resolve(watermarkedFile);
          } else {
            reject(new Error("Failed to create watermarked image"));
          }

          // Cleanup
          URL.revokeObjectURL(mainImg.src);
          URL.revokeObjectURL(watermarkImg.src);
        }, file.type);
      });
    } catch (error) {
      console.error("Error applying watermark:", error);
      throw error;
    }
  };

  // Add preview generation function
  useEffect(() => {
    let previewObjectUrl: string | null = null;

    const generatePreview = async () => {
      if (!selectedMedia?.originFileObj) {
        return;
      }

      try {
        if (!watermarkSettings.enabled) {
          previewObjectUrl = URL.createObjectURL(selectedMedia.originFileObj);
          setPreviewUrl(previewObjectUrl);
          return;
        }

        const watermarkedFile = await applyWatermark(
          selectedMedia.originFileObj
        );
        previewObjectUrl = URL.createObjectURL(watermarkedFile);
        setPreviewUrl(previewObjectUrl);
      } catch (error) {
        console.error("Preview generation failed:", error);
        message.error("Failed to generate preview");
      }
    };

    generatePreview();

    // Cleanup function
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [selectedMedia, watermarkSettings]);

  // Add this function to handle preset selection
  const handlePresetChange = async (value: string) => {
    if (value === "custom") {
      setWatermarkSettings((prev) => ({ ...prev, preset: value, image: null }));
      return;
    }

    try {
      const preset = WATERMARK_PRESETS.find((p) => p.value === value);
      if (!preset) return;

      const response = await fetch(preset.url);
      const blob = await response.blob();
      const file = new File([blob], `${preset.value}.svg`, {
        type: "image/svg+xml",
      });

      setWatermarkSettings((prev) => ({
        ...prev,
        preset: value,
        image: file,
      }));
    } catch (error) {
      console.error("Error loading preset watermark:", error);
      message.error("Failed to load preset watermark");
    }
  };

  useEffect(() => {
    if (!selectedMedia) return;

    if (watermarkSettings.enabled && watermarkSettings.image) {
      const generatePreview = async () => {
        try {
          const watermarkedFile = await applyWatermark(
            selectedMedia as unknown as File
          );
          const previewUrl = URL.createObjectURL(watermarkedFile);
          setPreviewUrl(previewUrl);
          return () => URL.revokeObjectURL(previewUrl);
        } catch (error) {
          console.error("Preview generation failed:", error);
          message.error("Failed to generate preview");
        }
      };
      generatePreview();
    } else {
      const previewUrl = URL.createObjectURL(selectedMedia as unknown as File);
      setPreviewUrl(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, [watermarkSettings, selectedMedia]);

  return (
    <Drawer
      title="Add New Media"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={400}
      extra={
        <Button
          type="primary"
          onClick={handleSave}
          loading={uploading}
          disabled={!selectedMedia}
        >
          Save
        </Button>
      }
    >
      <Spin spinning={uploading || isLoading} tip="Uploading media...">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Media"
            tooltip="Supports images, videos, audio, and documents up to 24MB"
          >
            {!selectedMedia ? (
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
            ) : (
              <div className="relative">
                {mediaType === "image" && previewUrl ? (
                  <Form.Item>
                    <div className="relative">
                      <Image
                        src={previewUrl}
                        alt="Preview with watermark"
                        className="w-full"
                      />
                      {!previewUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <span>Preview not available</span>
                        </div>
                      )}
                    </div>
                  </Form.Item>
                ) : (
                  <div className="h-60 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <p>{selectedMedia?.name}</p>
                  </div>
                )}
                <Button
                  className="absolute top-2 right-2"
                  onClick={() => setSelectedMedia(null)}
                  icon={<CloseOutlined />}
                />
              </div>
            )}
          </Form.Item>

          {mediaType === "image" && (
            <Collapse
              className="my-6"
              onChange={(keys) => {
                if (keys.includes("watermark")) {
                  setWatermarkSettings((prev) => ({ ...prev, enabled: true }));
                }
              }}
              items={[
                {
                  key: "watermark",
                  label: "Watermark Settings",
                  children: (
                    <>
                      <Form.Item
                        label="Enable Watermark"
                        valuePropName="checked"
                      >
                        <Switch
                          checked={watermarkSettings.enabled}
                          disabled={selectedMedia?.type === "image/svg+xml"}
                          onChange={(checked) => {
                            if (selectedMedia?.type === "image/svg+xml") {
                              message.error(
                                "Watermark cannot be applied to SVG images"
                              );
                              return;
                            }
                            setWatermarkSettings((prev) => ({
                              ...prev,
                              enabled: checked,
                            }));
                          }}
                        />
                        {selectedMedia?.type === "image/svg+xml" && (
                          <Alert
                            className="mt-2"
                            message="Watermark cannot be applied to SVG images"
                            type="error"
                            showIcon
                          />
                        )}
                      </Form.Item>

                      {watermarkSettings.enabled && (
                        <>
                          <Form.Item
                            label="Watermark Type"
                            tooltip="Choose a preset logo or upload your own"
                          >
                            <Select
                              size="large"
                              value={watermarkSettings.preset}
                              onChange={handlePresetChange}
                              options={WATERMARK_PRESETS.map((preset) => ({
                                label: (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    {preset.url && (
                                      <Image
                                        src={preset.url}
                                        alt={preset.label}
                                        width={20}
                                        height={20}
                                        preview={false}
                                      />
                                    )}
                                    {preset.label}
                                  </div>
                                ),
                                value: preset.value,
                              }))}
                            />
                          </Form.Item>

                          {watermarkSettings.preset === "custom" && (
                            <Form.Item
                              label="Custom Watermark"
                              required
                              tooltip="Upload an image to use as watermark (max 2MB)"
                            >
                              <Upload
                                accept="image/*"
                                maxCount={1}
                                beforeUpload={handleWatermarkUpload}
                                showUploadList={{
                                  showPreviewIcon: true,
                                  showRemoveIcon: true,
                                  showDownloadIcon: false,
                                }}
                                onRemove={() => {
                                  setWatermarkSettings((prev) => ({
                                    ...prev,
                                    image: null,
                                  }));
                                  return true;
                                }}
                              >
                                <Button icon={<UploadOutlined />}>
                                  {watermarkSettings.image
                                    ? "Change Watermark"
                                    : "Upload Watermark"}
                                </Button>
                              </Upload>
                            </Form.Item>
                          )}

                          <Form.Item
                            label="Opacity"
                            tooltip="Adjust the transparency of the watermark"
                          >
                            <Slider
                              min={0}
                              max={1}
                              step={0.1}
                              value={watermarkSettings.opacity}
                              onChange={(value) =>
                                setWatermarkSettings((prev) => ({
                                  ...prev,
                                  opacity: value,
                                }))
                              }
                            />
                          </Form.Item>

                          <Form.Item
                            label="Scale"
                            tooltip="Adjust the size of the watermark"
                          >
                            <Slider
                              min={0.05}
                              max={5}
                              step={0.1}
                              value={watermarkSettings.scale}
                              onChange={(value) =>
                                setWatermarkSettings((prev) => ({
                                  ...prev,
                                  scale: value,
                                }))
                              }
                            />
                          </Form.Item>

                          <Form.Item
                            label="Position"
                            tooltip="Select where to place the watermark"
                          >
                            <Select
                              size="large"
                              value={watermarkSettings.position}
                              onChange={(value: WatermarkPosition) =>
                                setWatermarkSettings((prev) => ({
                                  ...prev,
                                  position: value,
                                }))
                              }
                              options={[
                                { label: "Top Left", value: "top-left" },
                                { label: "Top Center", value: "top-center" },
                                { label: "Top Right", value: "top-right" },
                                { label: "Center Left", value: "center-left" },
                                { label: "Center", value: "center" },
                                {
                                  label: "Center Right",
                                  value: "center-right",
                                },
                                { label: "Bottom Left", value: "bottom-left" },
                                {
                                  label: "Bottom Center",
                                  value: "bottom-center",
                                },
                                {
                                  label: "Bottom Right",
                                  value: "bottom-right",
                                },
                              ]}
                            />
                          </Form.Item>

                          <Form.Item
                            label="Padding"
                            tooltip="Space around the watermark in pixels"
                          >
                            <InputNumber
                              min={0}
                              size="large"
                              className="w-full"
                              value={watermarkSettings.padding}
                              onChange={(value) =>
                                setWatermarkSettings((prev) => ({
                                  ...prev,
                                  padding: value ?? 0,
                                }))
                              }
                            />
                          </Form.Item>
                        </>
                      )}
                    </>
                  ),
                },
              ]}
            />
          )}

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

export default MediaUploadSidebar;
