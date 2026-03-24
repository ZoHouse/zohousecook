/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
import {
  DOCUMENT_EXTENSIONS,
  IMAGES_EXTENSIONS,
  VIDEOS_EXTENSIONS,
  blobToFile,
  getFileCategory,
  getFileExtension,
} from "@zo/utils/file";
import { useResponseFlash } from "@zo/utils/hooks";
import imageCompression from "browser-image-compression";
import React, { useRef } from "react";

export type AllowedFileType = "image" | "video" | "document";

interface FileUploadProps {
  label: string;
  value: any;
  setValue: React.Dispatch<any>;
  name: string;
  width?: string;
  height?: string;
  allowedFileTypes?: AllowedFileType[];
  objectFit?: string;
  placeholder?: string;
  imageExtensions?: string[];
  videoExtensions?: string[];
  required?: boolean;
  disabled?: boolean;
}

const getAllowedFileExtensions = (allowedTypes: AllowedFileType[]) => {
  let extensions: string[] = [];
  if (allowedTypes.includes("image")) {
    extensions = [...extensions, ...IMAGES_EXTENSIONS];
  }
  if (allowedTypes.includes("video")) {
    extensions = [...extensions, ...VIDEOS_EXTENSIONS];
  }
  if (allowedTypes.includes("document")) {
    extensions = [...extensions, ...DOCUMENT_EXTENSIONS];
  }
  return extensions.map((e) => `.${e}`).join(",");
};

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  setValue,
  name,
  width = "w-72",
  height = "h-72",
  objectFit = "object-contain",
  placeholder,
  allowedFileTypes,
  imageExtensions = IMAGES_EXTENSIONS,
  videoExtensions = VIDEOS_EXTENSIONS,
  label,
}) => {
  const [response, setResponse] = useResponseFlash(3000);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let _value;
    const _file = (e.target.files || [""])[0];
    if (_file instanceof File) {
      const extension = getFileExtension(_file);
      const fileInMb = _file.size / 1024 / 1024;
      if (extension === "jpeg" || extension === "jpg" || extension === "png") {
        const options = {
          maxSizeMB: 5,
          maxWidthOrHeight: 2500,
          useWebWorker: true,
        };
        try {
          const compressedBlob = await imageCompression(_file, options);
          const compressedFile = blobToFile(compressedBlob, _file.name);
          _value = compressedFile;
        } catch (error) {
          console.log(error);
        }
      } else if (IMAGES_EXTENSIONS.indexOf(extension) !== -1) {
        if (fileInMb < 5) {
          _value = _file;
        } else {
          setResponse("Image file should be less than 5 MB");
        }
      } else if (VIDEOS_EXTENSIONS.indexOf(extension) !== -1) {
        if (fileInMb < 16) {
          _value = _file;
        } else {
          setResponse("Video file should be less than 16 MB");
        }
      } else if (DOCUMENT_EXTENSIONS.indexOf(extension) !== -1) {
        if (fileInMb < 10) {
          _value = _file;
        } else {
          setResponse("Document should be less than 10 MB");
        }
      } else {
        setResponse("File not supported.");
        _value = null;
      }
      if (_value) {
        const category: AllowedFileType | null = getFileCategory(_value);
        if (
          category &&
          allowedFileTypes &&
          allowedFileTypes.length > 0 &&
          allowedFileTypes.indexOf(category) === -1
        ) {
          setResponse("File type not supported.");
          setValue(null);
        } else {
          setValue(_value);
        }
      }
    }
  };

  const isFile = value instanceof File;

  const hasImage = value
    ? imageExtensions.indexOf(getFileExtension(value)) !== -1
    : false;

  const hasVideo = value
    ? videoExtensions.indexOf(getFileExtension(value)) !== -1
    : false;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`flex flex-col h-[200px] flex-1 bg-zui-light items-center justify-center overflow-hidden cursor-pointer`}
      onClick={openFilePicker}
    >
      {value ? (
        <div className={` h-[200px] w-full items-center relative group`}>
          {hasImage ? (
            <img
              src={isFile ? URL.createObjectURL(value) : `${value}`}
              alt={name}
              className={`w-full h-full object-cover origin-center ${objectFit}`}
            />
          ) : hasVideo ? (
            <video
              className={`w-full h-full object-cover origin-center ${objectFit}`}
              autoPlay
              muted
              loop
            >
              <source src={isFile ? URL.createObjectURL(value) : `${value}`} />
            </video>
          ) : (
            <div
              className={`flex items-center justify-center h-full text-zui-silver`}
            >
              <Icon name="Doc" size={24} />
              <span>{value.name}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">{label}</div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        id={name}
        className="cursor-pointer focus:shadow-outline focus:outline-none"
        onChange={handleChange}
        accept={
          allowedFileTypes ? getAllowedFileExtensions(allowedFileTypes) : ""
        }
      />
      {(response || placeholder) && (
        <label
          htmlFor={name}
          className={`flex text-zui-silver cursor-pointer flex-col items-center justify-center ${width} ${height} p-3 text-subtitle`}
        >
          {placeholder && <span className="text-sm mt-1">{placeholder}</span>}
          {response && <span className="text-sm mt-1">{response}</span>}
        </label>
      )}
    </div>
  );
};

export default FileUpload;
