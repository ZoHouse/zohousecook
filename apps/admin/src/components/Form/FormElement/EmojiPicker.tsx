import { cn } from "@zo/utils/font";
import Emoji, { EmojiClickData, Theme } from "emoji-picker-react";
import React, { useEffect, useRef, useState } from "react";

interface EmojiPickerProps {
  label: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue?: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  label,
  name,
  setValue,
  value,
  disabled = false,
  required = false,
  initialValue = "",
}) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData, event: MouseEvent) => {
    setValue(emojiData.emoji);
    setIsPickerVisible(false);
  };

  const togglePicker = () => {
    if (!disabled) {
      setIsPickerVisible((prev) => !prev);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      pickerRef.current &&
      !pickerRef.current.contains(event.target as Node)
    ) {
      setIsPickerVisible(false);
    }
  };

  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue);
    }
  }, [initialValue, value, setValue]);

  useEffect(() => {
    if (isPickerVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPickerVisible]);

  return (
    <div className="w-full relative" ref={pickerRef}>
      <div
        className={cn(
          "flex bg-zui-light relative items-center justify-between w-full p-6 rounded-xl cursor-pointer"
        )}
        onClick={togglePicker}
      >
        <label
          htmlFor={name}
          className={cn(
            "text-base left-6 transition-all ease-in-out duration-100"
          )}
        >
          {label} {required && <span className="text-zui-silver">*</span>}
        </label>

        <div className="flex items-center space-x-2">
          <span className="text-lg">{value || "😊"}</span>
        </div>
      </div>

      {isPickerVisible && !disabled && (
        <div className="absolute top-full mt-2 z-50">
          <Emoji
            theme={Theme.DARK}
            autoFocusSearch={true}
            onEmojiClick={handleEmojiClick}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
