import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize, isValidUUID } from "@zo/utils/string";
import { App, Button, Drawer, Empty, Space, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface AddTripVendorServiceDestinationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
  vendorServicedestinationId?: string;
  initialValues?: GeneralObject;
}

const AddTripVendorServiceDestinationSidebar: React.FC<
  AddTripVendorServiceDestinationSidebarProps
> = ({
  isOpen,
  onClose,
  refetch,
  vendorServicedestinationId,
  initialValues,
}) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const isEdit = useMemo(
    () => isValidUUID(vendorServicedestinationId || ""),
    [vendorServicedestinationId]
  );

  const method = isEdit ? "PUT" : "POST";

  const vendorServiceDestinationInitialData = useMemo(() => {
    if (initialValues) {
      return {
        vendor: initialValues.vendor.id,
        service: initialValues.service.id,
        destination: initialValues.destination.id,
      };
    }
  }, [initialValues]);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && vendorServiceDestinationInitialData) {
        form.setFieldsValue(vendorServiceDestinationInitialData);
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, isEdit, initialValues, form]);

  const { data: vendorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_VENDORS", {
    refetchOnWindowFocus: false,
    select: (data) => {
      return data?.data?.results.map((item: GeneralObject) => ({
        label: formatCapitalize(item.name),
        value: item.id,
      }));
    },
  });

  const { data: vendorServiceOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_VENDOR_SERVICES", {
    refetchOnWindowFocus: false,
    select: (data) => {
      return data?.data?.results.map((item: GeneralObject) => ({
        label: formatCapitalize(item.name),
        value: item.id,
      }));
    },
  });

  const { data: destinationOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_DESTINATIONS", {
    refetchOnWindowFocus: false,
    select: (data) => {
      return data?.data?.results.map((item: GeneralObject) => ({
        label: formatCapitalize(item.name),
        value: item.id,
      }));
    },
  });

  const { mutate, isLoading } = useMutationApi(
    "CAS_VENDOR_SERVICE_DESTINATIONS",
    {},
    "",
    method
  );

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const route = isEdit ? `${vendorServicedestinationId}/` : "";

      mutate(
        {
          data: values,
          route,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["cas", "vendor-service-destinations"],
            });

            message.success(
              isEdit
                ? "Vendor Service Destination updated successfully"
                : "Vendor Service Destination created successfully"
            );
            refetch?.();
            handleClose();
          },
          onError: (error) => {
            message.error(processResponseError(error));
          },
        }
      );
    } catch {
      message.error("Failed to save vendor service destination");
    }
  };

  const formFields: FormElement[] = [
    {
      name: "vendor",
      label: "Vendor",
      type: "select",
      options: vendorOptions,
      searchQueryApi: "CAS_VENDORS",
      searchQueryKeyIdentifier: "id",
      required: true,
    },
    {
      name: "service",
      label: "Service",
      type: "select",
      options: vendorServiceOptions,
      searchQueryApi: "CAS_VENDOR_SERVICES",
      searchQueryKeyIdentifier: "id",
      required: true,
    },
    {
      name: "destination",
      label: "Destination",
      type: "select",
      options: destinationOptions,
      searchQueryApi: "CAS_VENDOR_SERVICES",
      notFoundContent: <Empty description="No destinations found" />,
      searchQueryKeyIdentifier: "id",
      required: true,
    },
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={
        isEdit
          ? "Edit Vendor Service Destination"
          : "Add Vendor Service Destination"
      }
      placement="right"
      width={500}
      extra={
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={isLoading}>
            Save
          </Button>
        </Space>
      }
    >
      <div className="py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" tip={isEdit ? "Updating..." : "Creating..."} />
          </div>
        ) : (
          <Form formData={form} formFields={formFields} />
        )}
      </div>
    </Drawer>
  );
};

export default AddTripVendorServiceDestinationSidebar;
