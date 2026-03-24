import { Loader } from "@zo/assets/lotties";
import { useMutationApi } from "@zo/auth";
import {
  blobToFile,
  getFileCategory,
  getFileExtension,
  IMAGES_EXTENSIONS,
  VIDEOS_EXTENSIONS,
} from "@zo/utils/file";
import { useResponseFlash } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import imageCompression from "browser-image-compression";
import { showToast } from "libs/moal/src/utils";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 16 * 1024 * 1024;
const ALLOWED_CATEGORIES = ["image", "video"];

const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useResponseFlash();

  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { mutate: uploadMedia } = useMutationApi(
    "GALLERY_MEDIA",
    {},
    `${process.env.MEME_RELATION_TYPE}/${process.env.MEME_RELATION_ID}/`
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        setError("File size exceeds 16 MB.");
      } else {
        setFile(null);
        setFile(file);
      }
    }
  };

  const compressImage = async (file: File): Promise<File | null> => {
    const extension = getFileExtension(file);
    const fileInMb = file.size / 1024 / 1024;
    let value = null;

    if (
      extension === "jpeg" ||
      extension === "jpg" ||
      extension === "png" ||
      extension === "gif"
    ) {
      const options = {
        maxSizeMB: 5,
        maxWidthOrHeight: 2500,
        useWebWorker: true,
      };
      try {
        const compressedBlob = await imageCompression(file, options);
        const compressedFile = blobToFile(compressedBlob, file.name);
        value = compressedFile;
      } catch (error) {
        console.log(error);
      }
    } else if (IMAGES_EXTENSIONS.indexOf(extension) !== -1) {
      if (fileInMb < 5) {
        value = file;
      } else {
        setError("Image file should be less than 5 MB");
        return null;
      }
    } else if (VIDEOS_EXTENSIONS.indexOf(extension) !== -1) {
      if (fileInMb < 16) {
        value = file;
      } else {
        setError("Video file should be less than 16 MB");
      }
    } else {
      setError("File not supported.");
      value = null;
    }

    return value;
  };

  const handleFileSubmit = async () => {
    if (!file) {
      setError("No File Selected.");
      return;
    }
    const category = getFileCategory(file);

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      setError("Only Images and Videos are allowed.");
      return;
    }

    setIsLoading(true);

    const value = await compressImage(file);

    if (value) {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("file", value);

      uploadMedia(
        {
          data: formData,
        },
        {
          onSuccess: () => {
            showToast("success", "Your Meme Has Reached the Unicorn World.");
            setIsLoading(false);
            queryClient.invalidateQueries(["gallery", "media"]);
            onClose();
          },
          onError: () => {
            showToast("error", "An Error Occured. Please Try Again");
            setIsLoading(false);
            onClose();
          },
        }
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  return isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-zui-dark border border-zui-light text-white rounded-lg p-6 w-full max-w-lg mx-4 sm:mx-auto">
        <h2 className="text-2xl mb-4">Upload Meme</h2>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="mb-4 w-full px-4 py-3  text-zui-silver border border-zui-silver rounded"
        />
        {isValidString(error) && (
          <span className="text-xs text-zui-red">{error}</span>
        )}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="mr-4 px-4 py-2 bg-transparent border border-transparent hover:border-zui-silver text-white rounded transition-colors"
          >
            Cancel
          </button>
          {isLoading ? (
            <Loader className="w-8 h-8" />
          ) : (
            <button
              disabled={!file}
              onClick={handleFileSubmit}
              className="px-4 py-2 bg-zui-light hover:opacity-80 text-white rounded transition-colors border border-transparent hover:border-zui-silver disabled:cursor-not-allowed"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;
};

export default MediaUploadModal;
