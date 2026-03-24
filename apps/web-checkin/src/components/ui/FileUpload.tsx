/* eslint-disable @next/next/no-img-element */
import { blobToFile, getFileExtension } from "@zo/utils/file";
import { cn } from "@zo/utils/font";
import imageCompression from "browser-image-compression";
import React, { useRef } from "react";

interface FileUploadProps {
  value: string | File;
  setValue: React.Dispatch<string | File>;
  name: string;
  isDisabled?: boolean;
  placeholder?: string;
  label: string;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  placeholder,
  setValue,
  className,
  label,
  isDisabled,
  name,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const _file = (e.target.files || [""])[0];
    console.log(_file);
    if (_file instanceof File) {
      const extension = getFileExtension(_file);
      if (extension === "jpeg" || extension === "jpg" || extension === "png") {
        const options = {
          maxSizeMB: 5,
          maxWidthOrHeight: 2500,
          useWebWorker: true,
        };
        try {
          const compressedBlob = await imageCompression(_file, options);
          const compressedFile = blobToFile(compressedBlob, _file.name);
          const _value = compressedFile;

          setValue(_value);
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <p className="py-4 font-semibold text-lg">{label}</p>
      <div
        className={cn(
          "flex flex-col h-[calc((100vw-48px)/1.5)] bg-cherry-background-input rounded-xl items-center justify-center overflow-hidden cursor-pointer",
          isDisabled && "pointer-events-none"
        )}
        onClick={!isDisabled ? openFilePicker : undefined}
      >
        {value ? (
          <div className="h-full items-center relative group">
            <img
              src={
                value instanceof File ? URL.createObjectURL(value) : `${value}`
              }
              alt={name}
              className="w-full h-full object-contain origin-center "
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <button
              className="focus:outline-none w-full h-full flex flex-col items-center justify-center relative"
              type="button"
            >
              <img
                src={placeholder}
                alt={name}
                className="w-full h-full object-cover"
              />
              <svg
                width="24"
                height="22"
                viewBox="0 0 24 22"
                fill="none"
                className="absolute"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.5 7C8.26324 7 9.72194 5.69615 9.96456 4H11C12.1046 4 13 3.10457 13 2C13 0.89543 12.1046 0 11 0H9.5C7.73676 0 6.27806 1.30385 6.03544 3H5C2.23858 3 0 5.23858 0 8V16C0 19.3137 2.68629 22 6 22H15C18.3137 22 21 19.3137 21 16C21 14.8954 20.1046 14 19 14C17.8954 14 17 14.8954 17 16C17 17.1046 16.1046 18 15 18H6C4.89543 18 4 17.1046 4 16V8C4 7.44772 4.44771 7 5 7H6.5ZM11 16C13.2091 16 15 14.2091 15 12C15 9.79086 13.2091 8 11 8C8.79086 8 7 9.79086 7 12C7 14.2091 8.79086 16 11 16ZM18.5 1C19.6046 1 20.5 1.89543 20.5 3V4.5H22C23.1046 4.5 24 5.39543 24 6.5C24 7.60457 23.1046 8.5 22 8.5H20.5V10C20.5 11.1046 19.6046 12 18.5 12C17.3954 12 16.5 11.1046 16.5 10V8.5H15C13.8954 8.5 13 7.60457 13 6.5C13 5.39543 13.8954 4.5 15 4.5H16.5V3C16.5 1.89543 17.3954 1 18.5 1Z"
                  fill="#E33056"
                />
              </svg>
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          disabled={isDisabled}
          id={name}
          className="cursor-pointer focus:shadow-outline focus:outline-none"
          onChange={handleChange}
          accept="image/*"
        />
      </div>
    </div>
  );
};

export default FileUpload;
