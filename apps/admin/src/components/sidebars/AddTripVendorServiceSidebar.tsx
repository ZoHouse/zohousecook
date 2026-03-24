import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidUUID } from "@zo/utils/string";
import { App, Button, Drawer, Space, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface AddTripVendorServiceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
  vendorServiceId?: string;
  initialValues?: GeneralObject;
}

const AddTripVendorServiceSidebar: React.FC<
  AddTripVendorServiceSidebarProps
> = ({ isOpen, onClose, refetch, vendorServiceId, initialValues }) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const isEdit = useMemo(
    () => isValidUUID(vendorServiceId || ""),
    [vendorServiceId]
  );

  const method = isEdit ? "PUT" : "POST";

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, isEdit, initialValues, form]);

  const { mutate, isLoading } = useMutationApi(
    "CAS_VENDOR_SERVICES",
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

      const route = isEdit ? `${vendorServiceId}/` : "";

      mutate(
        {
          data: values,
          route,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["cas", "vendor-services"],
            });

            message.success(
              isEdit
                ? "Vendor Service updated successfully"
                : "Vendor Service created successfully"
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
      message.error("Failed to save vendor service");
    }
  };

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "text",
      required: true,
    },
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Vendor Service" : "Add Vendor Service"}
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

export default AddTripVendorServiceSidebar;
