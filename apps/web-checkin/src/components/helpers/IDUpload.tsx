/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Handles ID document upload and verification with real-time status checking
 */
import { CheckinStep } from "../../config";
import { GeneralObject } from "@zo/definitions/general";
import axios, { AxiosProgressEvent } from "axios";
import { getZostelServerHeaders } from "libs/auth/src/utils";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui";
import ImageCropScreen from "./ImageCropScreen";
interface UploadIdProps {
  onSubmit: (data: GeneralObject) => void;
  availableIds: { id: string; name: string; isBackRequired: boolean }[];
  setCheckinStep: (step: CheckinStep) => void;
  isRepeatUser: boolean;
}

// Status types: pending, processing, failed, validated

type Step =
  | "instructions"
  | "upload-id-front"
  | "scanning-id-front"
  | "completed-id-front"
  | "upload-id-back"
  | "scanning-id-back"
  | "completed-id-back"
  | "submit";

const UploadId: React.FC<UploadIdProps> = ({
  onSubmit,
  availableIds,
  isRepeatUser,
  setCheckinStep,
}) => {
  const [step, setStep] = useState<Step>(isRepeatUser ? "upload-id-front" : "instructions");
  const completedSteps = useRef<Step[]>(isRepeatUser ? ["instructions"] : []);

  const [id, setId] = useState<string>("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const uploaderRef = useRef<HTMLInputElement>(null);
  const uploaderBackRef = useRef<HTMLInputElement>(null);

  const [identifier, setIdentifier] = useState<string>("");
  const startPinging = useRef(false);
  const [frontIdFailCount, setFrontIdFailCount] = useState(0);

  const [uploadingIds, setUploadingIds] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] =
    useState<string>("🔍 Scanning...");

  // Statuses to show sequentially
  const scanStatuses = [
    "🔍 Scanning...",
    "📄 Processing...",
    "🧠 Analyzing...",
    "🔄 Verifying...",
    "✅ Almost there...",
  ];

  // Add ref to track animation
  const statusAnimationTimeout = useRef<NodeJS.Timeout | null>(null);

  const [selectedIdType, setSelectedIdType] = useState<{
    id: string;
    name: string;
    isBackRequired: boolean;
  } | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  const [isCropping, setIsCropping] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [croppingImageSide, setCroppingImageSide] = useState<"front" | "back">(
    "front"
  );
  const [tempFile, setTempFile] = useState<File | null>(null);

  // Sequential scanning animation
  useEffect(() => {
    if (isScanning) {
      let currentStatusIndex = 0;

      const animateStatus = () => {
        setScanningStatus(scanStatuses[currentStatusIndex]);

        if (currentStatusIndex < scanStatuses.length - 1) {
          currentStatusIndex++;
          statusAnimationTimeout.current = setTimeout(animateStatus, 5500); // Show each status for 5.5 seconds
        }
      };

      // Start the animation
      animateStatus();
    }

    return () => {
      if (statusAnimationTimeout.current) {
        clearTimeout(statusAnimationTimeout.current);
      }
    };
  }, [isScanning]);

  // Poll server for ID scanning status
  useEffect(() => {
    let pingInterval: NodeJS.Timeout;
    const pingDelay = 8000; // Fixed 8 second interval

    if (startPinging.current) {
      const checkStatus = () => {
        // Temporary endpoint for status checking
        axios
          .get(
            `${process.env.API_BASE_URL_ZOSTEL}/api/v1/profile/me/assets/status/${identifier}/`,
            {
              headers: getZostelServerHeaders() as any,
            }
          )
          .then((response) => {
            const status = String(response.data?.status).toLowerCase();
            if (status === "validated") {
              // Clear any ongoing animations
              if (statusAnimationTimeout.current) {
                clearTimeout(statusAnimationTimeout.current);
              }

              setUploadingIds(false);
              setIsScanning(false);
              if (step === "scanning-id-front") {
                setStep("completed-id-front");
                setId(response.data.identifier);
              } else if (step === "scanning-id-back") {
                setStep("completed-id-back");
                setId(response.data.identifier);
              }
              startPinging.current = false;
              clearTimeout(pingInterval);
            } else if (status === "failed") {
              // Clear any ongoing animations
              if (statusAnimationTimeout.current) {
                clearTimeout(statusAnimationTimeout.current);
              }

              setScanningStatus("❌ Upload failed. Please try again.");

              if (step === "scanning-id-front") {
                const newFailCount = frontIdFailCount + 1;
                setFrontIdFailCount(newFailCount);

                if (newFailCount >= 2) {
                  setCheckinStep("upload-ids-error");
                } else {
                  // First failure, let user try again
                  setStep("upload-id-front");
                  setValidationError(
                    "ID verification failed. Please upload a clearer image."
                  );
                }
              } else {
                // For back ID, always go to error page
                setCheckinStep("upload-ids-error");
              }

              setUploadingIds(false);
              setIsScanning(false);
              startPinging.current = false;
              clearTimeout(pingInterval);
            } else if (status) {
              // We don't update status text here anymore since we have our animation
              // but still schedule the next check
              pingInterval = setTimeout(checkStatus, pingDelay);
            }
          })
          .catch((error) => {
            console.log("Error checking status:", error);
            // On error, still schedule the next check
            pingInterval = setTimeout(checkStatus, pingDelay);
          });
      };

      // Start the first check after a delay
      pingInterval = setTimeout(checkStatus, pingDelay);
    }

    return () => {
      if (pingInterval) {
        clearTimeout(pingInterval);
      }
      if (statusAnimationTimeout.current) {
        clearTimeout(statusAnimationTimeout.current);
      }
    };
  }, [identifier, step, setCheckinStep, frontIdFailCount]);

  const handleIDBackSubmit = async (id: File) => {
    setUploadingIds(true);
    setUploadProgress(0);
    setIsScanning(true);
    setScanningStatus("🔍 Scanning..."); // This will be overridden by the animation effect

    const headers = {
      ...getZostelServerHeaders(),
      "Content-Type": "multipart/form-data",
    };

    try {
      const formdata = new FormData();
      formdata.append("file", id);

      const response = await axios.post(
        `${process.env.API_BASE_URL_ZOSTEL}/api/v1/profile/me/assets/117/upload/`,
        formdata,
        {
          headers: headers as any,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(percentCompleted);
          },
        }
      );

      setUploadingIds(false);

      // Set identifier from response if available
      if (response.data?.key) {
        setIdentifier(response.data.key);
      }

      // For back ID, show animation for a bit then complete
      setTimeout(() => {
        if (statusAnimationTimeout.current) {
          clearTimeout(statusAnimationTimeout.current);
        }
        setStep("completed-id-back");
        setIsScanning(false);
      }, 3000);
    } catch (error) {
      console.log(error);
      if (statusAnimationTimeout.current) {
        clearTimeout(statusAnimationTimeout.current);
      }
      setUploadingIds(false);
      setIsScanning(false);
      setScanningStatus("❌ Upload failed. Please try again.");
    }
  };

  const handleUploadAgain = () => {
    setScanningStatus("🔍 Scanning...");
    if (step === "completed-id-back") {
      // Only reset the back ID and go back to upload-id-back
      setStep("upload-id-back");
      setIdBack(null);
      setUploadProgress(0);
      setValidationError(null);

      // Reset only the back file input
      if (uploaderBackRef.current) {
        uploaderBackRef.current.value = "";
      }
    } else {
      // Reset everything to initial state
      setStep("instructions");
      setIdFront(null);
      setIdBack(null);
      setId("");
      setUploadProgress(0);
      setValidationError(null);

      // Reset file inputs to ensure they can be reused
      if (uploaderRef.current) {
        uploaderRef.current.value = "";
      }
      if (uploaderBackRef.current) {
        uploaderBackRef.current.value = "";
      }

      // Reset completed steps
      completedSteps.current = ["instructions"];
    }
  };

  const handleStartUpload = (idType: {
    id: string;
    name: string;
    isBackRequired: boolean;
  }) => {
    if (step === "instructions") {
      setSelectedIdType(idType);
      setStep("upload-id-front");
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return "File is too large. Maximum size is 10MB.";
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return "Only JPG and PNG image formats are accepted.";
    }

    return null;
  };

  const handleFrontCrop = (file: File) => {
    if (file) {
      setCroppingImageSide("front");
      setIsCropping(true);
      setImageSrc(URL.createObjectURL(file));
    }
  };

  const handleBackCrop = (file: File) => {
    if (file) {
      setCroppingImageSide("back");
      setIsCropping(true);
      setImageSrc(URL.createObjectURL(file));
    }
  };

  const handleCropComplete = (croppedImage: File, side: "front" | "back") => {
    if (side === "front") {
      setIdFront(croppedImage as File);
      completedSteps.current.push("upload-id-front");
      setImageSrc("");
      handleIDFrontSubmit(croppedImage);
    } else {
      setIdBack(croppedImage);
      completedSteps.current.push("upload-id-back");
      handleIDBackSubmit(croppedImage);
      setImageSrc("");
    }
  };

  const handleIDFrontSubmit = async (id: File) => {
    const error = validateFile(id);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setUploadingIds(true);
    setUploadProgress(0);

    const headers = {
      ...getZostelServerHeaders(),
      "Content-Type": "multipart/form-data",
    };

    try {
      const formdata = new FormData();
      formdata.append("file", id);

      const response = await axios.post(
        `${process.env.API_BASE_URL_ZOSTEL}/api/v1/profile/me/assets/116/upload/`,
        formdata,
        {
          headers: headers as any,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(percentCompleted);
          },
        }
      );
      setUploadingIds(false);

      if (response.data?.key) {
        setIdentifier(response.data.key);

        setStep("scanning-id-front");
        setIsScanning(true);
        startPinging.current = true;
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.log(error);
      setUploadingIds(false);
      setScanningStatus("❌ Upload failed. Please try again.");
    }
  };

  const handleCropDismiss = () => {
    if (croppingImageSide === "front") {
      setIdFront(null);
    } else {
      setIdBack(null);
    }
    setIsCropping(false);
    setImageSrc("");

    // Reset file inputs to ensure they can be reused
    if (croppingImageSide === "front" && uploaderRef.current) {
      uploaderRef.current.value = "";
    } else if (croppingImageSide === "back" && uploaderBackRef.current) {
      uploaderBackRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    // Validate ID number format if needed
    if (!id) {
      setValidationError("ID number could not be extracted. Please try again.");
      return;
    }

    // Submit the data
    onSubmit({
      idNumber: id,
      idType: selectedIdType?.id || "",
      frontImage: idFront,
      backImage: idBack,
    });
  };

  return (
    <>
      {" "}
      <div className="flex flex-col flex-1">
        <div>
          {step === "instructions" && (
            <>
              <h2 className="text-2xl font-semibold text-[#111111]">
                Just one ID needed
              </h2>
              <ul className="mt-4">
                {availableIds.map((id) => (
                  <li
                    key={id.id}
                    className="flex items-center gap-2 mt-2 text-[#111111]"
                    onClick={() => {
                      handleStartUpload(id);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM6.27614 7.09763C5.75544 6.57693 4.91122 6.57693 4.39052 7.09763C3.86982 7.61833 3.86982 8.46255 4.39052 8.98324L6.27614 10.8689C6.79684 11.3896 7.64106 11.3896 8.16176 10.8689L11.4616 7.56903C11.9823 7.04833 11.9823 6.20411 11.4616 5.68341C10.9409 5.16271 10.0967 5.16271 9.57597 5.68341L7.21895 8.04044L6.27614 7.09763Z"
                        fill="#111111"
                        fillOpacity="0.44"
                      />
                    </svg>
                    {id.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          {[
            "upload-id-front",
            "scanning-id-front",
            "completed-id-front",
          ].includes(step) && (
            <h2 className="text-2xl font-semibold text-[#111111]">
              ID Card Front
            </h2>
          )}

          {["upload-id-back", "scanning-id-back", "completed-id-back"].includes(
            step
          ) && (
            <h2 className="text-2xl font-semibold text-[#111111]">
              ID Card Back
            </h2>
          )}

          {step === "instructions" && (
            <Button fullWidth className="mt-6" onClick={() => setStep("upload-id-front")}>Next</Button>
          )}

          {/* Upload ID Card Front */}

          {[
            "upload-id-front",
            "scanning-id-front",
            "completed-id-front",
          ].includes(step) && (
            <>
              <div
                role="button"
                onClick={() => {
                  if (
                    !isScanning &&
                    step !== "completed-id-front" &&
                    !uploadingIds
                  ) {
                    uploaderRef.current?.click();
                  }
                }}
                className="relative w-full h-[240px] border border-dashed rounded-2xl mt-4 flex flex-col items-center justify-center overflow-hidden"
              >
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center w-full h-full">
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 10 }).map((_, row) => (
                        <div key={row} className="flex gap-2">
                          {Array.from({ length: 16 }).map((_, col) => {
                            const delay = Math.random() * 1000;
                            return (
                              <svg
                                style={{ animationDelay: `${delay}ms` }}
                                className="scan-animation blur-[1px]"
                                key={`${row}-${col}`}
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="12" cy="12" r="2" fill="white" />
                              </svg>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {idFront ? (
                  <Image
                    width={320}
                    height={240}
                    src={URL.createObjectURL(idFront)}
                    alt="ID Front"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.80065 1.59992C8.32657 1.24436 7.67472 1.24436 7.20065 1.59992L4.53398 3.59992C3.94488 4.04175 3.82549 4.87748 4.26731 5.46659C4.70914 6.05569 5.54488 6.17508 6.13398 5.73325L6.66732 5.33325V8.66659C6.66732 9.40297 7.26427 9.99992 8.00065 9.99992C8.73703 9.99992 9.33398 9.40297 9.33398 8.66659V5.33325L9.86732 5.73325C10.4564 6.17508 11.2922 6.05569 11.734 5.46659C12.1758 4.87748 12.0564 4.04175 11.4673 3.59992L8.80065 1.59992ZM4.00065 7.99992C4.00065 7.26354 3.4037 6.66658 2.66732 6.66658C1.93094 6.66658 1.33398 7.26354 1.33398 7.99992V10.6666C1.33398 12.8757 3.12485 14.6666 5.33398 14.6666H10.6673C12.8765 14.6666 14.6673 12.8757 14.6673 10.6666V7.99992C14.6673 7.26354 14.0704 6.66658 13.334 6.66658C12.5976 6.66658 12.0007 7.26354 12.0007 7.99992V10.6666C12.0007 11.403 11.4037 11.9999 10.6673 11.9999H5.33398C4.5976 11.9999 4.00065 11.403 4.00065 10.6666V7.99992Z"
                        fill="#111111"
                      />
                    </svg>
                    <span className="text-sm text-[#111111] mt-1">
                      Upload ID Card Front
                    </span>
                  </>
                )}

                {uploadingIds && (
                  <div className="absolute bottom-0 left-0 w-full bg-black/70 p-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-zostel-common-progress h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-white text-xs text-center mt-1">
                      Uploading: {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                ref={uploaderRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFrontCrop(file);
                  }
                }}
              />
            </>
          )}

          {/* Upload ID Card Back */}
          {["upload-id-back", "scanning-id-back", "completed-id-back"].includes(
            step
          ) && (
            <>
              <div
                role="button"
                onClick={() => {
                  if (
                    !isScanning &&
                    step !== "completed-id-back" &&
                    !uploadingIds
                  ) {
                    uploaderBackRef.current?.click();
                  }
                }}
                className="relative w-full h-[240px] border border-dashed rounded-2xl mt-4 flex flex-col items-center justify-center overflow-hidden"
              >
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center w-full h-full">
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 10 }).map((_, row) => (
                        <div key={row} className="flex gap-2">
                          {Array.from({ length: 16 }).map((_, col) => {
                            const delay = Math.random() * 1000;
                            return (
                              <svg
                                style={{ animationDelay: `${delay}ms` }}
                                className="scan-animation blur-[1px]"
                                key={`${row}-${col}`}
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="12" cy="12" r="2" fill="white" />
                              </svg>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {idBack ? (
                  <Image
                    width={320}
                    height={240}
                    src={URL.createObjectURL(idBack)}
                    alt="ID Back"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.80065 1.59992C8.32657 1.24436 7.67472 1.24436 7.20065 1.59992L4.53398 3.59992C3.94488 4.04175 3.82549 4.87748 4.26731 5.46659C4.70914 6.05569 5.54488 6.17508 6.13398 5.73325L6.66732 5.33325V8.66659C6.66732 9.40297 7.26427 9.99992 8.00065 9.99992C8.73703 9.99992 9.33398 9.40297 9.33398 8.66659V5.33325L9.86732 5.73325C10.4564 6.17508 11.2922 6.05569 11.734 5.46659C12.1758 4.87748 12.0564 4.04175 11.4673 3.59992L8.80065 1.59992ZM4.00065 7.99992C4.00065 7.26354 3.4037 6.66658 2.66732 6.66658C1.93094 6.66658 1.33398 7.26354 1.33398 7.99992V10.6666C1.33398 12.8757 3.12485 14.6666 5.33398 14.6666H10.6673C12.8765 14.6666 14.6673 12.8757 14.6673 10.6666V7.99992C14.6673 7.26354 14.0704 6.66658 13.334 6.66658C12.5976 6.66658 12.0007 7.26354 12.0007 7.99992V10.6666C12.0007 11.403 11.4037 11.9999 10.6673 11.9999H5.33398C4.5976 11.9999 4.00065 11.403 4.00065 10.6666V7.99992Z"
                        fill="#111111"
                      />
                    </svg>
                    <span className="text-sm text-[#111111] mt-1">
                      Upload ID Card Back
                    </span>
                  </>
                )}

                {uploadingIds && (
                  <div className="absolute bottom-0 left-0 w-full bg-black/70 p-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-zostel-common-progress h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-white text-xs text-center mt-1">
                      Uploading: {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                ref={uploaderBackRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const error = validateFile(file);
                    if (error) {
                      setValidationError(error);
                      return;
                    }
                    setValidationError(null);
                    handleBackCrop(file);
                  }
                }}
              />
            </>
          )}
        </div>

        {isScanning && (
          <span className="text-center mt-6">{scanningStatus}</span>
        )}

        {validationError && (
          <div className="mt-4 p-3  border-red-400 text-red-700 rounded flex flex-col">
            <p className="text-sm">{validationError}</p>
            {step === "upload-id-front" && frontIdFailCount > 0 && (
              <Button
                variant="secondary"
                size="default"
                onClick={handleUploadAgain}
                className="mt-2"
              >
                Upload Again
              </Button>
            )}
          </div>
        )}

        {id && (
          <div className="space-y-6 py-6">
            {[
              "upload-id-front",
              "scanning-id-front",
              "completed-id-front",
            ].includes(step) && (
              <div className="flex items-center justify-between">
                <span>
                  <strong>Number:</strong> {id}
                </span>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_6295_8102)">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM6.27614 7.09763C5.75544 6.57693 4.91122 6.57693 4.39052 7.09763C3.86982 7.61833 3.86982 8.46255 4.39052 8.98324L6.27614 10.8689C6.79684 11.3896 7.64106 11.3896 8.16176 10.8689L11.4616 7.56903C11.9823 7.04833 11.9823 6.20411 11.4616 5.68341C10.9409 5.16271 10.0967 5.16271 9.57597 5.68341L7.21895 8.04044L6.27614 7.09763Z"
                      fill="#54B835"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_6295_8102">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            )}

            {["completed-id-front"].includes(step) && (
              <Button
                fullWidth
                variant="primary"
                size="default"
                onClick={() => {
                  setStep("upload-id-back");
                  completedSteps.current.push("completed-id-front");
                }}
                disabled={uploadingIds}
              >
                Upload ID Card Back
              </Button>
            )}

            {["completed-id-back"].includes(step) && (
              <Button
                fullWidth
                variant="primary"
                size="default"
                onClick={handleSubmit}
                disabled={uploadingIds}
              >
                Continue
              </Button>
            )}

            {["completed-id-front", "completed-id-back"].includes(step) && (
              <Button
                fullWidth
                variant="secondary"
                size="default"
                onClick={handleUploadAgain}
                disabled={uploadingIds}
              >
                Upload Again
              </Button>
            )}
          </div>
        )}
      </div>
      <ImageCropScreen
        isOpen={isCropping}
        onDismiss={handleCropDismiss}
        imageUrl={imageSrc}
        onCropComplete={handleCropComplete}
        side={croppingImageSide}
        closeBottomSheet={setIsCropping.bind(this, false)}
      />
    </>
  );
};

export default UploadId;
