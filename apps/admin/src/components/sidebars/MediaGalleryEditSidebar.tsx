import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { Form, FormElement } from "../Form";

interface MediaGalleryEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: GeneralObject;
  onSave: (data: GeneralObject, callback: () => void) => void;
}

const MediaGalleryEditSidebar: React.FC<MediaGalleryEditSidebarProps> = ({
  data,
  isOpen,
  onClose,
  onSave,
}) => {
  const [form] = useForm();
  const { message } = App.useApp();

  const formFields: FormElement[] = [
    { label: "Title", name: "title", type: "text" },
    { label: "ALT text", name: "alt", type: "text", required: true },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Priority", name: "sort_index", type: "number" },
  ];

  const handleSave = () => {
    if (!isValidString(form.getFieldValue("alt"))) {
      message.warning("ALT text is mandatory");
      return;
    }

    const _data = {
      sort_index: form.getFieldValue("sort_index"),
      id: data.id,
      metadata: {
        title: form.getFieldValue("title"),
        alt: form.getFieldValue("alt"),
        description: form.getFieldValue("description"),
      },
    };

    onSave(_data, () => form.resetFields());
  };

  const initialData = useMemo(() => {
    if (data) {
      return {
        sort_index: data.sort_index,
        title: data.metadata?.title,
        alt: data.metadata?.alt,
        description: data.metadata?.description,
      };
    }
    return {};
  }, [data, isOpen]);

  useEffect(() => {
    form.setFieldsValue(initialData);
  }, [initialData]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Edit Metadata"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button size="large" className="w-full" type="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="large"
            className="w-full"
            type="primary"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      }
    >
      <Form formFields={formFields} formData={form} />
    </Drawer>
  );
};

export default MediaGalleryEditSidebar;
