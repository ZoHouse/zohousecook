import { GeneralObject } from "@zo/definitions/general";
import { Button, Drawer, Space, UploadProps, message } from "antd";
import { useForm } from "antd/es/form/Form";
import Dragger from "antd/es/upload/Dragger";
import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Form, FormElement } from "../Form";
import RotateRightOutlinedIcon from '@mui/icons-material/RotateRightOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

export interface ImageUploaderFile {
  image: File;
  alt: string;
  description: string;
  title: string;
  priority?: number;
}

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (data: ImageUploaderFile) => void;
  file?: any;
  onSave?: (data: any) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  isOpen,
  onClose,
  onSelect,
  file,
  onSave,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const initialData = useMemo(() => {
    if (file?.metadata) {
      return {
        url: file.url,
        title: file?.metadata?.title,
        alt: file?.metadata?.alt,
        description: file?.metadata?.description,
        priority: file?.metadata?.priority,
      };
    } else {
      return {};
    }
  }, [file]);

  const [form] = useForm();

  const formFields: FormElement[] = [
    { label: "Title", name: "title", type: "text" },
    { label: "ALT text", name: "alt", type: "text", required: true },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Priority", name: "sort_index", type: "number" },
  ];

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImage = async (file: File, degrees: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Swap width and height if rotation is 90 or 270 degrees
        const swap = degrees % 180 !== 0;
        canvas.width = swap ? img.height : img.width;
        canvas.height = swap ? img.width : img.height;

        if (ctx) {
          // Move to center of canvas
          ctx.translate(canvas.width / 2, canvas.height / 2);
          // Rotate
          ctx.rotate((degrees * Math.PI) / 180);
          // Draw image centered
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Create new file from blob
              const rotatedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(rotatedFile);
            }
          }, file.type);
        }
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    if (!selectedImage || !form.getFieldValue("alt")) {
      message.warning("Please fill out all the mandatory fields");
      return;
    }

    let finalImage = selectedImage;
    if (rotation !== 0) {
      finalImage = await rotateImage(selectedImage, rotation);
    }

    const coverImage: GeneralObject = {
      image: finalImage,
      title: form.getFieldValue("title"),
      alt: form.getFieldValue("alt"),
      description: form.getFieldValue("description"),
      sort_index: form.getFieldValue("sort_index"),
    };

    if (onSelect) {
      await onSelect(coverImage as ImageUploaderFile);
    }

    if (onSave) {
      await onSave(coverImage);
    }

    handleClose();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Set title and alt from filename without extension
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      form.setFieldsValue({
        title: fileName,
        alt: fileName
      });
    }
  };

  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(form.getFieldValue("url") || null);
    }
  }, [selectedImage, form.getFieldValue("url")]);

  useEffect(() => {
    form.setFieldsValue(initialData);
  }, [initialData]);

  const props: UploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    accept: "image/*",
    beforeUpload: (file) => {
      setSelectedImage(file);
      // Set title and alt from filename without extension
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      form.setFieldsValue({
        title: fileName,
        alt: fileName
      });
      return false;
    },
    showUploadList: !!selectedImage && isOpen,
    onRemove(file) {
      setSelectedImage(null);
    },
    style: {
      height: "180px",
      borderStyle: "solid",
    },
    onDrop(e) {
      const file = e.dataTransfer.files[0];
      if (file) {
        setSelectedImage(file);
        // Set title and alt from filename without extension
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        form.setFieldsValue({
          title: fileName,
          alt: fileName
        });
      }
    },
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedImage(null);
    setPreviewUrl(null);
    setRotation(0);
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Upload Image"
      extra={
        <Space>
          {previewUrl && (
            <Button onClick={handleRotate} icon={<RotateRightOutlinedIcon />} />
          )}
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={24} className="w-full">
        <Dragger {...props}>
          <div className="flex flex-col items-center justify-center h-40">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="object-cover w-full h-full"
                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }}
              />
            ) : (
              <>
                <ImageOutlinedIcon sx={{ fontSize: 40, marginBottom: '12px' }} />
                <p className="text-base font-medium mb-1">
                  Drop your image here, or click to browse
                </p>
                <span className="text-sm text-zui-silver">
                  Supports JPG, PNG, SVG (max 5MB)
                </span>
              </>
            )}
          </div>
        </Dragger>
        <Form formFields={formFields} formData={form} />
      </Space>
      <input
        ref={imageInputRef}
        onChange={handleImageChange}
        className="hidden"
        type="file"
        accept="image/*"
      />
    </Drawer>
  );
};

export default ImageUploader;
