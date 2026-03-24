import { CloseOutlined, PictureOutlined } from "@ant-design/icons";
import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";
import { useFormData } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { Form as AntForm, Drawer, Input, InputNumber, Upload } from "antd";
import { Form, FormElementType, SidebarMini } from "libs/moal/src";
import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

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

  const tripImage = useMemo(() => {
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

  const {
    formData,
    handleChange,
    isFormDataChanged,
    getFormValue,
    resetFormData,
  } = useFormData(tripImage);

  const formFields: FormElementType[] = [
    { label: "Title", name: "title", type: "text" },
    { label: "ALT text", name: "alt", type: "text", required: true },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Priority", name: "priority", type: "number" },
  ];

  const openImagePicker = () => imageInputRef.current?.click();

  const handleSave = async () => {
    if (!selectedImage || !isValidObject(formData)) {
      toast.warning("Please fill out all the mandatory fields");
      return;
    }
    const coverImage: GeneralObject = {
      image: selectedImage || formData.url,
      title: formData.title,
      alt: formData.alt,
      description: formData.description,
      priority: formData.priority,
    };

    if (onSelect) {
      await onSelect(coverImage as ImageUploaderFile);
    }

    if (onSave) {
      await onSave(coverImage);
    }
    resetFormData();
    setSelectedImage(null);
    onClose();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(formData.url || null);
    }
  }, [selectedImage, formData.url]);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title="Upload Image"
      extra={
        <button className="ant-btn ant-btn-primary" onClick={handleSave}>
          Save
        </button>
      }
    >
      <div className="space-y-2">
        <div
          onClick={openImagePicker}
          className="w-full h-[180px] bg-zui-light flex items-center justify-center relative cursor-pointer"
        >
          {selectedImage && (
            <button
              className="absolute z-50 top-2 right-2"
              onClick={() => setSelectedImage(null)}
            >
              <Icon name="Cross" size={20} />
            </button>
          )}
          {previewUrl ? (
            <img
              className="object-cover w-full h-full"
              src={previewUrl}
              alt="Selected Image"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Icon name="Image" size={24} />
              <span className="text-sm text-zui-silver">
                Drag or upload Image
              </span>
            </div>
          )}
        </div>
        <Form
          formFields={formFields}
          handleChange={handleChange}
          formData={formData}
          getFormValue={getFormValue}
        />
      </div>
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
