import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { Button, Drawer, message } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { FormElement } from "../Form";
import Form from "../Form/Form";

interface AddTripDateProps {
  selectedDate: GeneralObject;
  selectedBatch: GeneralObject;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const AddTripDate: React.FC<AddTripDateProps> = ({
  selectedDate,
  selectedBatch,
  isOpen,
  onClose,
  refetch,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();

  const { mutate: handlePricing, isLoading: isLoadingPricing } = useMutationApi(
    "CAS_SKU",
    {},
    "",
    selectedDate ? "PUT" : "POST"
  );

  const { mutate: handleAvailability, isLoading: isLoadingAvailability } =
    useMutationApi(
      "CAS_SKU",
      {},
      "",
      selectedDate?.availabilityData ? "PUT" : "POST"
    );

  const initialValues = useMemo(() => {
    if (selectedDate) {
      return {
        sellable: selectedDate.sellable ? "true" : "false",
        date: dayjs(selectedDate.date),
        base_units: selectedDate?.availabilityData?.base_units,
        price: selectedDate?.priceData?.price,
      };
    } else {
      return {};
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isValidObject(initialValues)) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isOpen, initialValues]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const formattedDate = values.date
        ? values.date.format("YYYY-MM-DD")
        : null;
      const isUpdate = selectedDate?.availabilityData;
      let updatedUnits = values.base_units;

      if (isUpdate) {
        const oldBaseUnits = selectedDate.availabilityData.base_units || 0;
        const currentUnits = selectedDate.availabilityData.units || 0;
        const baseUnitsDifference = values.base_units - oldBaseUnits;
        updatedUnits = Math.max(0, currentUnits + baseUnitsDifference);
      }

      // Create all payloads
      const pricingPayload = {
        price: values.price,
        date: formattedDate,
        slot: null,
      };

      const availabilityPayload = {
        units: updatedUnits,
        base_units: values.base_units,
        date: formattedDate,
        sellable: values.sellable,
        slot: null,
      };

      const apiPromises = [];

      apiPromises.push(
        new Promise((resolve, reject) => {
          handlePricing(
            {
              data: pricingPayload,
              route: selectedDate
                ? `${selectedBatch?.id}/pricing/${selectedDate?.priceData.id}/`
                : `${selectedBatch?.id}/pricing/`,
            },
            {
              onSuccess: resolve,
              onError: (error) => {
                reject(error);
              },
            }
          );
        })
      );

      apiPromises.push(
        new Promise((resolve, reject) => {
          handleAvailability(
            {
              data: availabilityPayload,
              route: selectedDate?.availabilityData
                ? `${selectedBatch?.id}/availability/${selectedDate?.availabilityData.id}/`
                : `${selectedBatch?.id}/availability/`,
            },
            {
              onSuccess: resolve,
              onError: (error) => {
                reject(error);
              },
            }
          );
        })
      );

      await Promise.all(apiPromises);

      queryClient.invalidateQueries(["cas", "inventory"]);
      queryClient.invalidateQueries(["cas", "sku"]);
      refetch();

      message.success(
        `Batch ${selectedDate ? "updated" : "created"} successfully`
      );
      handleClose();
    } catch (error) {
      message.error(processResponseError(error));
    }
  };

  const handleClose = () => {
    onClose();
    form.resetFields();
  };

  const formFields: FormElement[] = [
    {
      name: "sellable",
      type: "radio",
      label: "Sellable",
      required: true,
      options: [
        { label: "Sellable", value: "true" },
        { label: "Unsellable", value: "false" },
      ],
    },
    {
      name: "date",
      type: "date",
      label: "Start Date",
      required: true,
      minDate: new Date(),
    },
    {
      name: "base_units",
      type: "number",
      label: "Total Units",
      required: true,
    },
    {
      name: "price",
      type: "price",
      label: "Price (excl. 5% GST)",
      placeholder: "Price (excl. 5% GST)",
      currency: selectedBatch?.currency,
      required: true,
    },
  ];

  return (
    <>
      <Drawer
        title={
          <>
            {selectedDate ? "Update" : "Add"} Date {selectedBatch?.name}{" "}
            <span className="text-zui-silver">
              ({selectedBatch?.itinerary?.title})
            </span>
          </>
        }
        onClose={handleClose}
        open={isOpen}
        extra={
          <Button
            onClick={handleSave}
            loading={isLoadingPricing || isLoadingAvailability}
            type="primary"
          >
            Save
          </Button>
        }
      >
        <Form
          formData={form}
          formFields={formFields}
          initialValues={initialValues}
        />
      </Drawer>
    </>
  );
};

export default AddTripDate;
