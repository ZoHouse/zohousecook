import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString, isValidUUID } from "@zo/utils/string";
import { Alert, Button, Drawer, Image, message, Upload } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { DiscoverCard } from "../../config";
import { Form, FormElement } from "../Form";

interface AddDiscoverCardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string | null;
}

const AddDiscoverCardSidebar: React.FC<AddDiscoverCardSidebarProps> = ({
  isOpen,
  onClose,
  cardId,
}) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const [isImageError, setIsImageError] = useState(false);

  const { data: cardDetail } = useQueryApi<DiscoverCard>(
    "CAS_DISCOVER_CARD",
    {
      enabled: isValidUUID(cardId),
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${cardId}/`
  );

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });

  const discoverTypeOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    return seed?.discover.discover_card.type.map((type: string) => ({
      label: formatCapitalize(type),
      value: type,
    }));
  }, [seed]);

  const discoverStatusOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    return seed?.discover.discover_card.status.map((status: string) => ({
      label: formatCapitalize(status),
      value: status,
    }));
  }, [seed]);

  const { mutate: mutateDiscoverCard } = useMutationApi(
    "CAS_DISCOVER_CARD",
    {},
    "",
    isValidUUID(cardId) ? "PUT" : "POST"
  );

  const formFields: FormElement[] = useMemo(
    () => [
      {
        name: "title",
        label: "Title",
        type: "text",
        required: true,
      },
      {
        name: "subtitle",
        label: "Subtitle",
        type: "textarea",
        required: true,
      },

      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: discoverTypeOptions,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: discoverStatusOptions,
      },
      {
        name: "category",
        label: "Category",
        type: "text",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
      },
      {
        name: "link_text",
        label: "Link Text",
        type: "text",
        required: true,
      },
      {
        name: "link_url",
        label: "Link URL",
        type: "text",
        required: true,
      },
      {
        name: "sort_index",
        label: "Sort Index",
        type: "number",
        minValue: 0,
      },
    ],
    [discoverTypeOptions, discoverStatusOptions]
  );

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const formData = new FormData();

    // Add all form fields
    formFields.forEach((field) => {
      if (values[field.name] !== undefined && values[field.name] !== null) {
        let value = values[field.name];
        if (field.type === "number") {
          value = String(value);
        }
        formData.append(field.name, value);
      }
    });

    // Handle file upload separately
    const mediaFile = form.getFieldValue("media");
    if (mediaFile) {
      formData.append("media", mediaFile.originFileObj);
    }

    mutateDiscoverCard(
      { data: formData, route: isValidUUID(cardId) ? `${cardId}/` : "" },
      {
        onSuccess() {
          message.success(
            isValidUUID(cardId)
              ? "Discover Card Updated!"
              : "Discover Card Created!"
          );
          queryClient.invalidateQueries({
            queryKey: ["cas", "discover-card"],
          });
          onClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (isValidUUID(cardId) && isValidObject(cardDetail)) {
      const _cardDetail = { ...cardDetail, media: null };
      form.setFieldsValue(_cardDetail);
    } else {
      form.resetFields();
    }
  }, [isOpen, cardDetail]);

  return (
    <Drawer
      title={isValidUUID(cardId) ? "Edit Discover Card" : "Add Discover Card"}
      open={isOpen}
      onClose={handleClose}
      extra={<Button onClick={handleSubmit}>Save</Button>}
    >
      <Form
        formData={form}
        formFields={formFields}
        initialValues={cardDetail}
      />
      <Upload
        onChange={(info) => {
          if (info.file.status === "done" || info.fileList.length > 0) {
            form.setFieldValue("media", info.fileList[0]);
          } else {
            form.setFieldValue("media", null);
          }
        }}
        maxCount={1}
        beforeUpload={() => false}
      >
        <Button>Click to Upload</Button>
      </Upload>

      {isValidString(cardDetail?.media) && !isImageError && (
        <Image
          onError={setIsImageError.bind(null, true)}
          src={cardDetail?.media}
          alt="Discover Card Media"
          className="mt-6"
        />
      )}

      {isImageError && (
        <Alert
          className="mt-6"
          message="Image not found"
          type="error"
          showIcon
        />
      )}
    </Drawer>
  );
};

export default AddDiscoverCardSidebar;
