import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface EditItineraryDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItinerary: string;
  section: any;
  selectedItem: any;
  baseRoute: any;
  refetch?: () => void;
}

// Main component
const EditItineraryDetails: React.FC<EditItineraryDetailsProps> = ({
  isOpen,
  selectedItinerary,
  onClose,
  section,
  selectedItem,
  baseRoute,
  refetch,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();

  const { mutate: editDetails } = useMutationApi(
    "CAS_INVENTORY_ITINERARIES",
    {},
    "",
    "PUT"
  );

  const formFields: FormElement[] = [
    {
      name: "title",
      type: "text",
      label: "Title",
      required: true,
      isHidden: section !== "faq",
    },
    {
      name: "emoji",
      type: "emojiPicker",
      label: "Emoji",
      required: true,
      isHidden: section === "faq",
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      required: true,
    },
  ];

  const formattedData = useMemo(() => {
    if (isValidUUID(selectedItinerary)) {
      return {
        description: selectedItem?.description,
        emoji: selectedItem?.icon,
        title: selectedItem?.title,
      };
    }
    return {};
  }, [selectedItinerary, selectedItem]);

  useEffect(() => {
    if (isValidUUID(selectedItinerary) && isValidObject(formattedData)) {
      form.setFieldsValue(formattedData);
    } else {
      form.resetFields();
    }
  }, [isOpen, formattedData]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const _data = form.getFieldsValue();
      const payload = {
        description: _data.description,
        icon: _data.emoji,
        ...(baseRoute === "faqs" && { title: _data.title }),
      };

      editDetails(
        {
          data: payload,
          route: `${selectedItinerary}/${baseRoute}/${selectedItem?.id}/`,
        },
        {
          onSuccess() {
            message.success(`Itinerary detail updated successfully.`);
            queryClient.invalidateQueries(["cas", "sku"]);
            handleClose();
            refetch?.();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  }, [form, handleClose, selectedItinerary]);

  return (
    <Drawer
      title={`Edit Itinerary Details`}
      placement="right"
      open={isOpen}
      width={400}
      onClose={onClose}
      extra={
        <Button
          onClick={handleSave}
          type="primary"
          disabled={!isValidObject(selectedItem)}
        >
          Save
        </Button>
      }
    >
      <Form
        formFields={formFields}
        formData={form}
        initialValues={formattedData}
      />
    </Drawer>
  );
};

export default EditItineraryDetails;
