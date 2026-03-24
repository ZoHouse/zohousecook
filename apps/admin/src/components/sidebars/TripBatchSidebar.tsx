import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface TripBatchProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  itineraryId: string;
  selectedBatch: any;
}

const TripBatch: React.FC<TripBatchProps> = ({
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
        itinerary: selectedBatch?.itinerary?.id,
        name: selectedBatch?.name,
        sellable: selectedBatch?.sellable ? "true" : "false",
        advance_percent: selectedBatch?.advance_percent,
      };
    }
    return {
      advance_percent: 100,
    };
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
        disabled: isValidUUID(selectedBatch?.id),
      },
      {
        name: "sellable",
        type: "radio",
        options: [
          { label: "sellable", value: "true" },
          { label: "Unsellable", value: "false" },
        ],
        initialValue: "false",
        label: "Sellable",
      },
      {
        name: "advance_percent",
        label: "Advance Percentage",
        type: "number",
        minValue: 0,
        maxValue: 100,
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
        sellable: _data.sellable === "true" ? true : false,
        ...(isValidUUID(selectedBatch?.id)
          ? {}
          : { itinerary: _data.itinerary }),
        inventory: itineraryId,
        advance_percent: _data.advance_percent ?? 100,
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

export default TripBatch;
