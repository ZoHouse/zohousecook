import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import Icon, { IconName } from "@zo/assets/icons";
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import { Button, Drawer, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import EmojiPicker, { Theme } from "emoji-picker-react";
import React, { useEffect, useState } from "react";
import { CASFeaturesResponse } from "../../config";
import { Form, FormElement } from "../Form";

interface Features {
  icon: IconName;
  title: string;
  description: string;
}
interface FeaturesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GeneralObject) => void;
  onUpdate: (id: string, data: GeneralObject) => void;
  selectedFeature: string | null;
  containerId: string;
  endpoint: QueryEndpoints;
}

const Features: React.FC<FeaturesProps> = ({
  isOpen,
  onSave,
  onClose,
  onUpdate,
  selectedFeature,
  containerId,
  endpoint,
}) => {
  const [form] = useForm();

  const { data, isLoading } = useQueryApi<CASFeaturesResponse>(
    endpoint,
    {
      enabled: isValidString(containerId) && isValidString(selectedFeature),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${containerId}/features/${selectedFeature}/`
  );

  const [iconPreview, setIconPreview] = useState<string>("");

  const formFields: FormElement[] = [
    {
      label: "Title",
      type: "text",
      name: "name",
      required: true,
    },
    {
      label: "Description",
      type: "textarea",
      name: "description",
    },
  ];

  const handleSave = async () => {
    if (isValidString(selectedFeature)) {
      onUpdate(selectedFeature as string, {
        ...form.getFieldsValue(),
        icon: iconPreview,
      });
    } else {
      onSave({ ...form.getFieldsValue(), icon: iconPreview });
    }
    form.resetFields();
    setIconPreview("");
    onClose();
  };

  const handleEmojiSelect = (emojiData: any) => {
    form.setFieldsValue({ icon: emojiData.emoji });
    setIconPreview(emojiData.emoji);
  };

  useEffect(() => {
    if (data && isValidString(selectedFeature as string)) {
      form.setFieldsValue({
        name: data.name,
        description: data.description,
      });

      setIconPreview(data.icon || "");
    }
  }, [data, selectedFeature]);

  return (
    <Drawer
      title={isValidString(selectedFeature) ? "Edit Amenity" : "Add Amenity"}
      placement="right"
      closable
      onClose={onClose}
      open={isOpen}
      extra={
        <div style={{ textAlign: "right" }}>
          <Button onClick={handleSave} type="primary">
            {isValidString(selectedFeature) ? "Update" : "Save"}
          </Button>
        </div>
      }
    >
      <Spin spinning={isValidString(selectedFeature) && isLoading}>
        <div className="flex gap-2 items-start relative">
          <Popover>
            <PopoverTrigger className="cursor-pointer">
              {iconPreview ? (
                <div className="text-2xl py-2">{iconPreview}</div>
              ) : (
                <>
                  <div className="cursor-pointer border-2 rounded-xl border-zui-stroke p-2">
                    <Icon name="Plus" fill="#5A5A5A" size={24} />
                  </div>
                </>
              )}
            </PopoverTrigger>
            <PopoverContent
              className="w-fit p-0 bg-zui-dark border border-zui-light z-30"
              align="center"
            >
              <EmojiPicker
                theme={Theme.DARK}
                style={{
                  top: "0",
                  zIndex: 1000,
                }}
                height="400px"
                width="300px"
                autoFocusSearch={true}
                onEmojiClick={handleEmojiSelect}
              />
            </PopoverContent>
          </Popover>
          <Form className="w-full" formFields={formFields} formData={form} />
        </div>
      </Spin>
    </Drawer>
  );
};

export default Features;
