import { useMutationApi, useQueryApi } from "@zo/auth";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormValidation } from "@zo/utils/hooks";
import { formatCapitalize } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React from "react";
import { Form, FormElement } from "../../Form";

interface PartnerAddInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  operatorId?: string | null;
}

const PartnerAddInventory: React.FC<PartnerAddInventoryProps> = ({
  isOpen,
  onClose,
  refetch,
  operatorId,
}) => {
  const [form] = useForm();

  const { message } = App.useApp();

  const { data: inventoryCategoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.inventory.category.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: taxCategoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.taxation.tax_category.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: applicableTaxOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.taxation.applicable_taxes.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { mutate: createInventory } = useMutationApi("CAS_INVENTORY");

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (operatorId) {
        createInventory(
          {
            data: {
              ...values,
              operator: operatorId,
              type: "stay",
            },
          },
          {
            onSuccess: (data) => {
              refetch();
              message.success("Inventory Created.");
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    });
  };

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },

    {
      name: "status",
      label: "Status",
      type: "radio",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "category",
      label: "Room Category",
      type: "select",
      required: true,
      options: inventoryCategoryOptions,
    },
    {
      name: "description",
      label: "Description",
      required: true,
      type: "textarea",
    },
    {
      name: "occupancy",
      label: "Max Occupancy",
      required: true,
      type: "spinner",
      minValue: 0,
    },

    {
      label: "Tax Category",
      name: "tax_category",
      type: "select",
      required: true,
      options: taxCategoryOptions,
    },
    {
      name: "applicable_taxes",
      label: "Applicable Taxes",
      type: "multiSelect",
      required: true,
      options: applicableTaxOptions,
    },
  ];

  const { areAllRequiredFieldsPresent } = useFormValidation(
    form,
    formFields as FormElementType[]
  );

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      maskClosable={false}
      title="Add Inventory"
      extra={
        <Button
          disabled={!areAllRequiredFieldsPresent}
          type="primary"
          onClick={handleSave}
        >
          Save
        </Button>
      }
    >
      <div className="pb-10">
        <h2 className="text-zui-silver mb-6">Basic Info</h2>
        <Form formData={form} formFields={formFields} />
      </div>
    </Drawer>
  );
};

export default PartnerAddInventory;
