import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidUUID } from "@zo/utils/string";
import { App, Button, Drawer, Space, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface AddTripVendorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
  vendorId?: string;
  initialValues?: GeneralObject;
}

const AddTripVendorSidebar: React.FC<AddTripVendorSidebarProps> = ({
  isOpen,
  onClose,
  refetch,
  vendorId,
  initialValues,
}) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const isEdit = useMemo(() => isValidUUID(vendorId || ""), [vendorId]);

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

  const { mutate, isLoading } = useMutationApi("CAS_VENDORS", {}, "", method);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const route = isEdit ? `${vendorId}/` : "";

      mutate(
        {
          data: values,
          route,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["cas", "vendors"],
            });

            message.success(
              isEdit
                ? "Vendor updated successfully"
                : "Vendor created successfully"
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
      message.error("Failed to save vendor");
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
      name: "mobile",
      label: "Mobile",
      type: "phone",
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
    },
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Vendor" : "Add Vendor"}
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

export default AddTripVendorSidebar;
