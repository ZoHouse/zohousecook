import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface AddItineraryProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  itineraryId: string;
  selectedItineraryId: string;
}

const AddItinerary: React.FC<AddItineraryProps> = ({
  isOpen,
  onClose,
  refetch,
  itineraryId,
  selectedItineraryId,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();

  const { mutate: createItineraries, isLoading: isUpdating } = useMutationApi(
    "CAS_INVENTORY_ITINERARIES",
    {},
    "",
    `${isValidUUID(selectedItineraryId) ? "PUT" : "POST"}`
  );

  const { data: itinerary, isLoading } = useQueryApi<GeneralObject>(
    "CAS_INVENTORY_ITINERARIES",
    {
      enabled: isOpen && isValidUUID(selectedItineraryId),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${selectedItineraryId}/`,
    `ordering=-created_at`
  );

  const formattedData = useMemo(() => {
    if (itinerary) {
      return {
        ...itinerary,
        inventory: itineraryId,
        has_insurance_included: itinerary?.has_insurance_included
          ? "true"
          : "false",
      };
    } else {
      return {};
    }
  }, [itinerary]);

  const formFields: FormElement[] = useMemo(
    () => [
      {
        name: "title",
        label: "Title",
        type: "text",
        required: true,
      },
      {
        name: "duration",
        label: "Duration",
        required: true,
        type: "number",
        minValue: 1,
      },
      {
        name: "pickup_location",
        label: "Pickup Location",
        type: "text",
        required: true,
      },
      {
        name: "drop_location",
        label: "Drop Location",
        type: "text",
        required: true,
      },
      {
        name: "short_description",
        label: "Short Description",
        type: "textarea",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
      },
      {
        name: "enquiry_form_url",
        label: "Enquiry Form",
        type: "text",
      },
      {
        name: "has_insurance_included",
        label: "Insurance Included",
        type: "radio",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ],
        required: true,
      },
    ],
    []
  );

  const handleClose = () => {
    onClose();
    form.resetFields();
  };

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const _data = form.getFieldsValue();
      const payload = {
        ..._data,
        data: {
          enquiry_form: values.enquiry_form,
        },
        inventory: itineraryId,
      };

      const route = isValidUUID(selectedItineraryId)
        ? `${selectedItineraryId}/`
        : ``;

      createItineraries(
        {
          data: payload,
          route,
        },
        {
          onSuccess() {
            message.success(
              `Itinerary ${
                selectedItineraryId ? "updated" : "added"
              } successfully.`
            );
            queryClient.invalidateQueries(["cas", "inventory-itineraries"]);
            handleClose();
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  }, [form, handleClose, itineraryId, refetch]);

  useEffect(() => {
    if (isValidUUID(selectedItineraryId) && isValidObject(formattedData)) {
      form.setFieldsValue(formattedData);
    } else {
      form.resetFields();
    }
  }, [isOpen, formattedData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={selectedItineraryId ? "Edit Itinerary" : "Add Itinerary"}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Spin spinning={isUpdating || isLoading}>
        <Form
          formData={form}
          formFields={formFields}
          initialValues={formattedData}
        />
      </Spin>
    </Drawer>
  );
};

export default AddItinerary;
