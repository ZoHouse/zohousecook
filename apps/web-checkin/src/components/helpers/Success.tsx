/* eslint-disable @next/next/no-img-element */
import { cn } from "@zo/utils/font";
import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";
import { Image as ImageType } from "../../config";
import { kalamClassName } from "../../utils/font";
import { Button } from "../ui";
interface SuccessProps {
  propertyImage?: ImageType;
  propertyName?: string;
  propertyCity?: string;
  viewBookingHandler?: () => void;
}
/**
 * Success component that displays an animated confirmation for web check-in
 */
const Success: React.FC<SuccessProps> = ({
  propertyImage,
  propertyName,
  propertyCity,
  viewBookingHandler,
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="h-[592px] flex flex-col bg-zostel-common-zostel py-10 rounded-2xl relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center flex-shrink-0"
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto"
            aria-hidden="true"
          >
            <g clipPath="url(#clip0_6295_8776)">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40ZM15.6904 17.7441C14.3886 16.4423 12.2781 16.4423 10.9763 17.7441C9.67456 19.0458 9.67456 21.1564 10.9763 22.4581L15.6904 27.1722C16.9921 28.4739 19.1026 28.4739 20.4044 27.1722L28.654 18.9226C29.9557 17.6209 29.9557 15.5103 28.654 14.2086C27.3522 12.9068 25.2417 12.9068 23.9399 14.2086L18.0474 20.1011L15.6904 17.7441Z"
                fill="white"
              />
            </g>
            <defs>
              <clipPath id="clip0_6295_8776">
                <rect width="40" height="40" fill="white" />
              </clipPath>
            </defs>
          </svg>

          <h2 className="text-2xl font-semibold text-white text-center mt-4">
            Web Check-in to {propertyName} Done.
          </h2>

          <Button
            theme="dark"
            variant="primary"
            size="small"
            className="mt-6 text-xs font-semibold"
            onClick={viewBookingHandler}
          >
            View Booking
          </Button>
        </motion.div>

        <div className="flex-1 overflow-hidden w-full relative">
          <div className="flex-1 absolute bottom-0 left-1/2 -translate-x-1/2 w-full z-20">
            <div className="relative w-fit flex-1 mx-auto">
              <Image
                src="https://cdn.zo.xyz/gallery/media/images/654326c0-754b-4ac7-83a6-be42f8a42f10_20250414094931.svg"
                alt="envelope"
                width={240}
                height={160}
                className="mx-auto object-cover w-full h-full max-w-[248px]"
                priority
              />

              {/* Simple stamp animation with static end state */}
              <motion.div
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  delay: 1.2,
                  duration: 0.8,
                  bounce: 0.4,
                }}
                className="absolute bottom-4 right-6 z-20 origin-center"
                style={{ opacity: 1 }} // Force opacity to always be 1
              >
                <Image
                  src="https://cdn.zo.xyz/gallery/media/images/8f0a4122-ac6d-4d6d-9b8b-debe0103570e_20250312112849.svg"
                  alt="stamp"
                  width={80}
                  height={80}
                  className="object-contain w-32 h-32 drop-shadow-lg"
                  priority
                />
              </motion.div>
            </div>
          </div>

          {/* Card/Pass that slides in from top */}
          <motion.div
            initial={{ opacity: 0, y: -1200 }}
            animate={{ opacity: 1, y: -30 }}
            transition={{
              type: "spring",
              delay: 0.4,
              duration: 0.8,
              bounce: 0.2,
            }}
            className="mx-auto w-[220px] mt-16 px-6 py-6 success-pass-card"
          >
            <div className="flex items-center justify-between -mt-1">
              <h2 className={cn("font-bold text-xl", kalamClassName)}>
                {propertyCity}
              </h2>

              <Image
                src={
                  "https://cdn.zo.xyz/gallery/media/images/46bc5ba2-ee99-4158-a804-2fa2589e664b_20241128083835.svg"
                }
                width={100}
                height={100}
                alt="zostel logo"
                priority
                className="w-5 h-5"
              />
            </div>

            <div className="w-full h-[192px] mx-auto mt-2">
              {propertyImage?.image ? (
                <Image
                  src={`${propertyImage.image}?w=220`}
                  width={220}
                  height={220}
                  alt={propertyName || ""}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <span className="h-full w-full text-zostel-light-text-secondary flex items-center justify-center font-medium animate-pulse">
                  <Image
                    src={
                      "https://cdn.zo.xyz/gallery/media/images/46bc5ba2-ee99-4158-a804-2fa2589e664b_20241128083835.svg"
                    }
                    width={100}
                    height={100}
                    alt="zostel logo"
                    priority
                    className="w-16 h-16 animate-spin duration-[4000]"
                  />
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <span className="text-zostel-light-text-primary mt-6 font-medium">
        You can close this window
      </span>
      <div className="mt-6">
        <h2 className="mobile-title text-center">Download Zostel App</h2>

        <div className="flex gap-4 items-center justify-center mt-4">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://apps.apple.com/us/app/zostel/id1620655522"
            className="bg-zostel-light-background-secondary rounded-lg shadow-md p-4 flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Image
              src={
                "https://cdn.zo.xyz/gallery/media/images/38566eb2-ff04-485a-a767-312e968e42e9_20250407155327.svg"
              }
              width={120}
              height={40}
              alt="app store"
              className="object-contain h-6 bg-zostel-light-background-secondary"
              priority
            />
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://play.google.com/store/apps/details?id=com.zostel.app.android"
            className="bg-zostel-light-background-secondary rounded-lg shadow-md p-4 flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Image
              src={
                "https://cdn.zo.xyz/gallery/media/images/ec35c4fe-ae5b-4987-97b3-37546acf72b8_20250407155626.svg"
              }
              width={120}
              height={40}
              alt="play store"
              className="object-contain h-6 bg-zostel-light-background-secondary"
              priority
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Success;
