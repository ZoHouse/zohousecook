import { FormElement, FormElementType, SidebarMini } from "@zo/moal";
import { useFormData } from "@zo/utils/hooks";
import EmojiPicker, { Theme } from "emoji-picker-react";
import React, { useState } from "react";

interface AddTripDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripDetails: { emoji: string; text: string }) => void;
}

const AddTripDetails: React.FC<AddTripDetailsProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { formData, handleChange, getFormValue } = useFormData({});

  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  const handleCreateTripDetails = () => {
    const newTripDetail = {
      emoji: selectedEmoji,
      text: formData.name,
    };
    onSave(newTripDetail);
    onClose();
  };

  const formFields: FormElementType[] = [
    {
      name: "name",
      type: "text",
      label: "Title",
    },
  ];

  const handleEmojiClick = (emojiObject: any) => {
    setSelectedEmoji(emojiObject.unified);
  };

  return (
    <>
      <SidebarMini
        disableOutsideTapClose
        isOpen={isOpen}
        onClose={onClose}
        headerOptions={{
          title: "Add Trip Details",
          hasCloseButton: true,
        }}
        footerOptions={{
          actionButtons: [
            {
              label: "Save",
              onClick: handleCreateTripDetails,
              type: "primary",
            },
          ],
        }}
      >
        <div className="flex gap-4">
          <div className="w-[316px]">
            <EmojiPicker
              theme={Theme.DARK}
              height="400px"
              width="300px"
              open={true}
              autoFocusSearch={true}
              onEmojiClick={handleEmojiClick}
            />

            <form className="flex flex-1 flex-col mt-6 space-y-0.5 w-full">
              {formFields.map((dr) => {
                return (
                  <div className="flex flex-col w-full" key={dr.name}>
                    <FormElement
                      {...dr}
                      hideLabel
                      className=""
                      value={getFormValue(formData, dr.name, dr.alias)}
                      setValue={handleChange.bind(null, dr.name, dr.type)}
                    />
                  </div>
                );
              })}
            </form>
          </div>
          <div className="flex-1"></div>
        </div>
      </SidebarMini>
    </>
  );
};

export default AddTripDetails;
