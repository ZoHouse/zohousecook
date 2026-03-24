import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { getFileCategory } from "@zo/utils/file";
import { cn } from "@zo/utils/font";
import { useVisibilityState } from "@zo/utils/hooks";
import { formatCapitalize } from "@zo/utils/string";
import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SidebarMini } from "libs/moal/src";
import { AllowedFileType } from "./FileUpload";
import FormElement, { FormElement as FormElementType } from "./FormElement";

interface MediaUploadProps {
  label: string;
  value: any;
  setValue: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  mediaKey?: string;
  allowedFileTypes?: AllowedFileType[];
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  label,
  name,
  setValue,
  value,
  disabled,
  required,
  mediaKey,
  allowedFileTypes,
}) => {
  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    select: (data) => data.data,
    refetchOnWindowFocus: false,
  });

  const categoryOptions = useMemo(() => {
    if (seed) {
      return seed.gallery.media.category.map((category: string) => ({
        label: formatCapitalize(category),
        value: category,
      }));
    } else {
      return [];
    }
  }, [seed]);
  const [isMediaPickerOpen, showMediaPicker, hideMediaPicker] =
    useVisibilityState();

  const [formData, setFormData] = useState<GeneralObject>({
    metadata: {
      title: "",
      description: "",
      alt_text: "",
    },
  });
  const mediaPickerRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const openImagePicker = (e: any) => {
    e.preventDefault();
    if (mediaPickerRef.current) {
      mediaPickerRef.current.click();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (name: string, value: any) => {
    if (name === "file") {
      const category = getFileCategory(value);
      console.log(category);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category,
        relationType: mediaKey,
      }));
    } else {
      console.log("inside eles", value);

      setFormData((prev) => ({
        ...prev,
        relationType: mediaKey,
        metadata: { ...prev.metadata, [name]: value },
      }));
    }
  };

  // const handleSave = () => {
  //   if (!formData.alt || !formData.category || !selectedFile) {
  //     toast.warning("Please fill out all required(*) fields");
  //     return;
  //   }
  //   const data = new FormData();
  //   data.append("file", selectedFile);
  //   data.append("category", formData.category);
  //   data.append(
  //     "metadata",
  //     JSON.stringify({
  //       alt: formData.alt,
  //       title: formData.title,
  //       description: formData.description,
  //     })
  //   );
  //   console.log(data, selectedFile, formData, "data");

  //   setValue(data);
  //   hideMediaPicker();
  // };

  const formFields: FormElementType[] = [
    {
      label: "ALT text",
      name: "alt",
      type: "text",
      required: true,
    },
    {
      label: "Title",
      name: "title",
      type: "text",
    },
    {
      label: "Description",
      name: "description",
      type: "text",
    },
  ];

  useEffect(() => {
    if (!value) {
      return;
    }

    const url = value.url ? value.url : URL.createObjectURL(value.file);
    setPreviewUrl(url);

    const type = value.category;
    setMediaType(type);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value]);

  const handleShowMediaSidebar = (e: any) => {
    e.preventDefault();
    showMediaPicker();
  };

  const handleSave = () => {
    setValue(formData);
    hideMediaPicker();
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col justify-center bg-zui-light relative w-full px-6 py-6",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <label className={cn("text-xs text-zui-white")}>
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>

        {value && previewUrl ? (
          <div>
            {mediaType === "image" ? (
              <img
                className="w-[316px] h-[200px]"
                src={previewUrl}
                alt="Preview"
                onClick={handleShowMediaSidebar}
              />
            ) : (
              <video
                className="w-[316px] h-[200px]"
                controls
                src={previewUrl}
                onClick={handleShowMediaSidebar}
              />
            )}
          </div>
        ) : (
          <div
            onClick={handleShowMediaSidebar}
            className=" bg-zui-lighter h-[160px] mt-4 w-full grid place-content-center"
          >
            <Icon
              name="Plus"
              size={16}
              fill="#5a5a5a"
              className="justify-self-center"
            />
            Upload Media
          </div>
        )}
      </div>
      <SidebarMini
        headerOptions={{ title: "Media Upload", hasCloseButton: true }}
        isOpen={isMediaPickerOpen}
        onClose={hideMediaPicker}
        footerOptions={{
          actionButtons: [{ label: "Save", onClick: handleSave }],
        }}
      >
        <div className="space-y-1">
          <FormElement
            type="file"
            name="file"
            allowedFileTypes={allowedFileTypes}
            label=""
            hideLabel
            className=""
            value={formData["file"] || formData["url"]}
            setValue={handleChange.bind(null, "file")}
          />
          <form className="flex flex-1 flex-col space-y-0.5 w-full">
            {formFields.map((dr) => {
              return (
                <div className="flex flex-col w-full" key={dr.name}>
                  <FormElement
                    {...dr}
                    hideLabel
                    className=""
                    value={formData.metadata[dr.name]}
                    setValue={handleChange.bind(null, dr.name)}
                  />
                </div>
              );
            })}
          </form>
        </div>
      </SidebarMini>
    </>
  );
};

export default MediaUpload;
