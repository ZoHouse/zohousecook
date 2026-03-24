/* eslint-disable @next/next/no-img-element */
import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { isClient } from "@zo/utils/next";
import { isValidString } from "@zo/utils/string";
import React from "react";

interface UserDocumentProps {
  src: string | null;
  name: string;
}

const UserDocument: React.FC<UserDocumentProps> = ({ src, name }) => {
  const openLink = () => {
    if (isClient && isValidString(src)) {
      window.open(src || "", "_blank");
    }
  };

  const isPdf = isValidString(src) && src?.toLowerCase().endsWith(".pdf");

  return (
    <button
      className={cn(
        "max-w-[300px] w-full h-[200px] relative border-zui-light border flex items-center justify-center",
        isValidString(src) ? "cursor-pointer" : "cursor-default"
      )}
      onClick={openLink}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        {isPdf ? (
          <>
            <Icon name="Doc" size={24} fill="rgb(90,90,90)" />
            <span className="text-sm flex items-center gap-2">
              {name} PDF
              <Icon name="NewTab" size={24} fill="rgb(90,90,90)" />
            </span>
          </>
        ) : (
          <>
            <Icon name="Camera" size={24} fill="rgb(90,90,90)" />
            <span className="text-sm text-zui-silver">{name}</span>
          </>
        )}
      </div>
      {!isPdf && isValidString(src) && (
        <img
          src={src || ""}
          alt={name}
          className="w-full h-full object-contain relative"
        />
      )}
    </button>
  );
};

export default UserDocument;
