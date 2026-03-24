import React, { useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { Button } from "../ui/Button";
import Image from "next/image";
import { useWindowSize } from "@zo/utils/hooks";

interface ImageCropScreenProps {
  isOpen: boolean;
  onDismiss: () => void;
  imageUrl: string;
  onCropComplete: (croppedImage: File, side: "front" | "back") => void;
  side: "front" | "back";
  closeBottomSheet: () => void;
}

const ImageCropScreen: React.FC<ImageCropScreenProps> = ({
  isOpen,
  onDismiss,
  imageUrl,
  onCropComplete,
  side,
  closeBottomSheet,
}) => {
  const { isMobile } = useWindowSize();

  const heightFactor = 0.9;

  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgElementRef.current = e.currentTarget;
  };

  const getCroppedImg = () => {
    if (!imgElementRef.current || !completedCrop) return;

    const image = imgElementRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        // Create a File from the blob
        const file = new File([blob], `cropped-${side}.jpeg`, {
          type: "image/jpeg",
        });

        onCropComplete(file, side);
        closeBottomSheet();
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <BottomSheet
      open={isOpen}
      onDismiss={onDismiss}
      snapPoints={({ maxHeight }) => [maxHeight * heightFactor]}
      className="custom-bottom-sheet fixed inset-0"
    >
      <div className="p-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-center">Crop Image</h2>
        <div className="flex justify-center">
          {imageUrl && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-h-[60vh] object-contain"
            >
              <Image
                ref={imageRef}
                src={imageUrl}
                alt="Crop me"
                className="max-h-[60vh] w-auto object-contain"
                onLoad={onImageLoad}
                width={320}
                height={240}
              />
            </ReactCrop>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={onDismiss} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={getCroppedImg} className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ImageCropScreen;
