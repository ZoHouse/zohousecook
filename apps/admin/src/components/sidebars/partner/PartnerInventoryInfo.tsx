import { useMutationApi, useQueryApi } from "@zo/auth";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormValidation } from "@zo/utils/hooks";
import { getChangedFields } from "@zo/utils/object";
import { formatCapitalize } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Inventory } from "../../../config";
import { Form, FormElement } from "../../Form";

interface PartnerInventoryInfoProps {
  isOpen: boolean;
  onClose: () => void;
  operatorId: string | undefined;
  inventoryId: string;
  refetch: () => void;
}

const PartnerInventoryInfoSidebar: React.FC<PartnerInventoryInfoProps> = ({
  isOpen,
  onClose,
  inventoryId,
  refetch,
}) => {
  const queryClient = useQueryClient();

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

  const { data: InventoryDetails, refetch: refetchInventoryDetails } =
    useQueryApi<Inventory>(
      "CAS_INVENTORY",
      {
        enabled: isOpen && inventoryId != undefined,
        select: (data) => data.data,
      },
      `${inventoryId}/`
    );

  const formattedData = useMemo(() => {
    if (InventoryDetails) {
      return {
        name: InventoryDetails.name,
        occupancy: InventoryDetails.occupancy || 0,
        status: InventoryDetails.status,
        applicable_taxes: InventoryDetails.applicable_taxes,
        category: InventoryDetails.category,
        description: InventoryDetails.description,
        tax_category: InventoryDetails.tax_category,
        type: InventoryDetails.type,
      };
    } else {
      return {};
    }
  }, [InventoryDetails]);

  const { mutate: updateInventory } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "PUT"
  );

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    updateInventory(
      {
        data: getChangedFields(formattedData, form.getFieldsValue()),
        route: `${inventoryId}/`,
      },
      {
        onSuccess() {
          message.success("Inventory details have been updated");
          queryClient.invalidateQueries({
            queryKey: ["cas", "inventory"],
          });
          refetch();
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
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
      label: "Max Cccupancy",
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

  useEffect(() => {
    if (formattedData) {
      form.setFieldsValue(formattedData);
    }
  }, [formattedData]);

  const { hasFormDataChanged } = useFormValidation(
    form,
    formFields as FormElementType[],
    formattedData
  );

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Inventory Info"
      extra={
        <Button
          onClick={handleSave}
          type="primary"
          disabled={!hasFormDataChanged}
        >
          Save
        </Button>
      }
    >
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default PartnerInventoryInfoSidebar;
