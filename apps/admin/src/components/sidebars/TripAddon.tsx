import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidUUID } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface TripAddonProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  inventoryId: string;
  addonData: any;
}

const TripAddon: React.FC<TripAddonProps> = ({
  isOpen,
  onClose,
  refetch,
  inventoryId,
  addonData,
}) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  useEffect(() => {
    if (addonData) {
      form.setFieldsValue({
        name: addonData.name,
        vendor: addonData?.vendor?.id,
        description: addonData.description,
        status: addonData.status,
        vendor_price: addonData.data?.vendor_price,
      });
    }
  }, [addonData, form]);

  const { data: vendorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_OPERATOR_VENDORS", {
    refetchOnWindowFocus: false,
    select: (data) =>
      data.data.results.map((opeartor: any) => ({
        label: opeartor.name,
        value: opeartor.id,
      })),
  });

  const { mutate: tripAddon, isLoading: isTripAddonLoading } = useMutationApi(
    "CAS_ADDONS",
    {},
    "",
    addonData ? "PUT" : "POST"
  );

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    select: (data) => data.data,
    refetchOnWindowFocus: false,
  });

  const addonStatusOptions = useMemo(() => {
    if (seed) {
      return seed?.["addon"]?.status.map((status: any) => ({
        label: formatCapitalize(status),
        value: status,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const initialValues = useMemo(() => {
    if (addonData) {
      return {
        name: addonData.name,
        vendor: addonData?.vendor?.id,
        description: addonData.description,
        status: addonData.status,
        vendor_price: addonData.data?.vendor_price,
      };
    } else {
      return {};
    }
  }, [addonData]);

  useEffect(() => {
    if (isValidUUID(addonData?.id) && isValidObject(initialValues)) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isOpen, initialValues]);

  const handleSave = (values: any) => {
    form.validateFields().then((values) => {
      const formData = {
        name: values.name,
        inventory: inventoryId,
        vendor: values.vendor,
        description: values.description,
        status: values.status,
        data: {
          vendor_price: values.vendor_price,
        },
      };
      const route = addonData ? `${addonData.id}/` : "";
      tripAddon(
        { data: formData, route: route },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "addons"],
            });
            message.success("Add-On updated successfully");
            handleClose();
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const currency = {
    code: "INR",
    id: "INR",
    name: "Indian Rupee",
    decimals: 8,
    symbol: "₹",
  };

  const formFields: FormElement[] = [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      name: "vendor_price",
      type: "price",
      label: "Vendor Price",
      currency: currency,
    },
    {
      name: "vendor",
      type: "select",
      label: "Vendor",
      options: vendorOptions,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
    },
    {
      name: "status",
      type: "radio",
      label: "Status",
      initialValue: "active",
      options: addonStatusOptions,
    },
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={addonData ? "Edit Add-On" : "Add New Add-On"}
      destroyOnClose
      maskClosable={false}
      width={500}
      extra={
        <div className="flex justify-end mt-2">
          <Button loading={isTripAddonLoading} onClick={handleSave}>
            Save
          </Button>
        </div>
      }
    >
      <Form
        formData={form}
        formFields={formFields}
        initialValues={initialValues}
      />
    </Drawer>
  );
};

export default TripAddon;
