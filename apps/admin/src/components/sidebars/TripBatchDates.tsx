import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface TripDateProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  itineraryId: string;
  selectedBatch: any;
}

const TripDate: React.FC<TripDateProps> = ({
  isOpen,
  onClose,
  refetch,
  itineraryId,
  selectedBatch,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();

  const { mutate: createBatch, isLoading: isUpdating } = useMutationApi(
    "CAS_SKU",
    {},
    "",
    `${isValidUUID(selectedBatch?.id) ? "PUT" : "POST"}`
  );

  const { data: ItineraryOptions, isLoading } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_INVENTORY_ITINERARIES",
    {
      refetchOnWindowFocus: false,
      enabled: isOpen && isValidUUID(itineraryId),
      select: (data) => {
        return data.data.results.map((Itinerary: any) => ({
          label: Itinerary.title,
          value: Itinerary.id,
        }));
      },
    },
    ``,
    `inventory=${itineraryId}`
  );

  const formattedData = useMemo(() => {
    if (isValidObject(selectedBatch)) {
      return {
        inventory: itineraryId,
        name: selectedBatch?.name,
        sellable: selectedBatch?.sellable,
      };
    }
    return {};
  }, [selectedBatch]);

  const formFields: FormElement[] = useMemo(
    () => [
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
      },
      {
        name: "itinerary",
        label: "Choose Itinerary",
        type: "select",
        options: ItineraryOptions || [],
        required: true,
      },
      {
        name: "sellable",
        label: "Sellable",
        type: "switch",
        switchToggleOptions: [
          { label: "sellable", value: "true" },
          { label: "Unsellable", value: "false" },
        ],
        initialValue: "false",
      },
    ],
    [ItineraryOptions]
  );

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const _data = form.getFieldsValue();
      const payload = {
        name: _data.name,
        sellable: _data.sellable,
        ...(isValidUUID(selectedBatch?.id)
          ? {}
          : { itinerary: _data.itinerary }),
        inventory: itineraryId,
      };

      const route = isValidUUID(selectedBatch?.id)
        ? `${selectedBatch?.id}/`
        : ``;

      createBatch(
        {
          data: payload,
          route,
        },
        {
          onSuccess() {
            message.success(
              `Batch ${selectedBatch ? "updated" : "added"} successfully.`
            );
            queryClient.invalidateQueries(["cas", "sku"]);
            handleClose();
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  }, [form, handleClose, selectedBatch, refetch]);

  useEffect(() => {
    if (isValidUUID(selectedBatch) && isValidObject(formattedData)) {
      form.setFieldsValue(formattedData);
    } else {
      form.resetFields();
    }
  }, [isOpen, formattedData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={selectedBatch ? "Edit Batch" : "Add Batch"}
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

export default TripDate;
