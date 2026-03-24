import Icon from "@zo/assets/icons";
import { useMutationApi } from "@zo/auth";
import { cn } from "@zo/utils/font";
import { useVisibilityState } from "@zo/utils/hooks";
import { Media } from "apps/admin/src/config";
import { SidebarMini } from "libs/moal/src";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { showToast } from "../../utils";

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
  label,
  name,
  setValue,
  value,
  disabled,
  required,
}) => {
  const [isIconPickerVisible, showIconPicker, hideIconPicker] =
    useVisibilityState();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { mutate: uploadIcon, isLoading } = useMutationApi("CAS_MEDIA");

  const openImagePicker = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const discardImageHandler = () => {
    setSelectedFile(null);
  };

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
          onError: showToast.bind(
            null,
            "error",
            "An Error Occured. Please Try Again."
          ),
        }
      );
    }
  };

  const discardFile: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setValue("");
  };
  return (
    <>
      <div
        className={cn(
          "flex bg-zui-light relative justify-between w-full px-6 py-6",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <label className={cn("text-sm text-zui-white")}>
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>
        {value ? (
          <div className="flex items-center">
            <span onClick={showIconPicker} className="truncate w-40 text-xs">
              {value}
            </span>
            <button onClick={discardFile}>
              <Icon name="Cross" size={24} />
            </button>
          </div>
        ) : (
          <span onClick={showIconPicker} className="text-zui-neon text-sm">
            Upload
          </span>
        )}
      </div>
      <SidebarMini
        headerOptions={{ title: "Upload Media", hasCloseButton: true }}
        footerOptions={{
          actionButtons: [
            {
              label: "Save",
              onClick: handleSave,
              disabled: selectedFile == null,
              isLoading: isLoading,
            },
          ],
        }}
        isOpen={isIconPickerVisible}
        onClose={hideIconPicker}
      >
        <div className="w-full">
          <div
            onClick={openImagePicker}
            className="w-[316px] md:w-full h-[180px] bg-zui-light flex items-center justify-center relative cursor-pointer"
          >
            {selectedFile && (
              <button
                className="absolute top-4 right-4 z-50"
                onClick={discardImageHandler}
              >
                <Icon name="Cross" size={20} />
              </button>
            )}
            {previewUrl ? (
              <img
                className="object-contain w-full h-full"
                src={previewUrl}
                alt="Selected File"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Icon name="Image" size={24} />
                <span className="text-sm text-zui-silver">Upload Media</span>
              </div>
            )}
          </div>
        </div>
        <input
          ref={imageInputRef}
          onChange={handleChange}
          className="hidden"
          type="file"
        />
      </SidebarMini>
    </>
  );
};

export default MediaLinkGenerator;
