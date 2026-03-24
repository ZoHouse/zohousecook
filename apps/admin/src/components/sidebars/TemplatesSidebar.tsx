import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { getChangedFields } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Alert, Button, Drawer, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Template } from "../../config";
import { Form, FormElement } from "../Form";

interface TemplatesSidebarProps {
  templateId: string | null;
  onClose: () => void;
  isOpen: boolean;
}

const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({
  isOpen,
  onClose,
  templateId,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();
  const channel = useWatch("channel", form);
  const contentType = useWatch("contentType", form);

  const { data: templateDetails } = useQueryApi<Template>(
    "CAS_TEMPLATES",
    {
      enabled: isOpen && isValidString(templateId),
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${templateId}/`
  );

  const initialData = useMemo(() => {
    if (templateId && templateDetails) {
      const _data: GeneralObject = {
        category: templateDetails.category,
        channel: templateDetails.channel,
        status: templateDetails.status,
        name: templateDetails.name,
        content: templateDetails.content,
        contentType: "json",
        destination: {
          channel: templateDetails.destination?.channel || 0,
          bot_name: templateDetails.destination?.bot_name || "",
        },
      };

      if (typeof templateDetails.content === "object") {
        _data.contentType = "json";
      } else {
        _data.contentType = "text";
      }

      return _data;
    } else {
      return {
        contentType: "json",
      };
    }
  }, [templateDetails && templateId]);

  const { mutate } = useMutationApi(
    "CAS_TEMPLATES",
    {},
    "",
    templateId ? "PUT" : "POST"
  );

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });

  const channelOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed?.relay?.template?.channel?.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const categoryOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed?.relay?.template?.category?.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const statusOptions = useMemo<Array<{ label: string; value: string }>>(() => {
    if (seed) {
      return seed?.relay?.template?.status?.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const formFields: FormElement[] = [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Template Name",
    },
    {
      name: "status",
      type: "radio",
      options: statusOptions,
      required: true,
      label: "Template Status",
    },
    {
      name: "channel",
      type: "select",
      options: channelOptions,
      required: true,
      label: "Channel",
      disabled: isValidString(templateId),
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: categoryOptions,
      label: "Category",
    },
    {
      name: "destination.channel",
      type: "number",
      minValue: 0,
      required: false,
      label: "Channel ID",
      isHidden: !["discord", "slack", "telegram"].includes(channel),
    },
    {
      name: "destination.bot_name",
      type: "text",
      required: false,
      label: "Bot Name",
      isHidden: !["discord", "slack"].includes(channel),
    },
    {
      name: "contentType",
      type: "select",
      required: true,
      label: "Content Type",
      options: ["text", "json"].map((option) => ({
        value: option,
        label: formatCapitalize(option),
      })),
    },
    {
      name: "content",
      type:
        form.getFieldValue("contentType") === "json" ? "jsonInput" : "textarea",
      required: true,
      label: "Content",
    },
    {
      name: "destination",
      type: "jsonInput",
      required: true,
      label: "Destination",
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = () => {
    form.validateFields().then((formData) => {
      if (templateId && templateDetails) {
        return mutate(
          {
            data: getChangedFields(templateDetails, formData),

            route: `${templateId}/`,
          },
          {
            onSuccess: (data: GeneralObject) => {
              message.success("Template Updated.");
              queryClient.invalidateQueries(["cas", "templates"]);
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } else {
        mutate(
          {
            data: formData,
          },
          {
            onSuccess: (data: GeneralObject) => {
              message.success("Added successfully.");
              queryClient.invalidateQueries(["cas", "templates"]);
              form.resetFields();
              onClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    });
  };

  useEffect(() => {
    if (templateId && initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, templateId]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={templateId ? `Update Template` : `Add a New Template`}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Alert
        message="Note: Channel cannot be changed in existing template."
        type="info"
        showIcon
        className="mb-4"
      />
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default TemplatesSidebar;
