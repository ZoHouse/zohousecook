import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { App, Button, Drawer, Space, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface BatchAddonSidebarProps {
  pricingData: any;
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
  refetch: () => void;
}

const BatchAddonSidebar: React.FC<BatchAddonSidebarProps> = ({
  pricingData,
  isOpen,
  onClose,
  inventoryId,
  refetch,
}) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [addons, setAddOns] = useState<GeneralObject[]>([]);

  const { mutate: createAddons, isLoading } = useMutationApi(
    "CAS_ADDONS_PRICES",
    {},
    "",
    "POST"
  );

  const { refetch: refetchAddons } = useInfiniteTable({
    setter: setAddOns,
    queryEndpoint: "CAS_ADDONS",
    name: "addons",
    customSearchQuery: `inventory=${inventoryId}`,
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      const _data = form.getFieldsValue();

      const payload = {
        ..._data,
        date: pricingData.date,
      };

      createAddons(
        {
          data: payload,
          route: ``,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries(["cas", "addons", "prices"]);
            refetch();
            message.success("Addon price added successfully");
            form.resetFields();
            handleClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  }, [form, handleClose, refetch]);

  const formFields: FormElement[] = useMemo(
    () => [
      {
        name: "addon",
        label: "Select Addon",
        type: "select",
        required: true,
        options: addons.map((addon) => ({
          label: addon.name,
          value: addon.id,
        })),
      },
      {
        name: "price",
        label: "Price",
        type: "price",
        required: true,
        currency: pricingData?.currency,
      },
      {
        name: "applicable_from",
        label: "Applicable From",
        type: "datetime",
        required: true,
        minDate: new Date(),
      },
      {
        name: "applicable_till",
        label: "Applicable Till",
        type: "datetime",
        required: true,
        minDate: new Date(),
        rules: [
          {
            validator: (_: any, value: string) => {
              const applicableFrom = form.getFieldValue("applicable_from");
              if (!value || !applicableFrom) return Promise.resolve();
              return value >= applicableFrom
                ? Promise.resolve()
                : Promise.reject(
                    "Applicable Till must be greater than or equal to Applicable From"
                  );
            },
            dependencies: ["applicable_from"],
          },
        ],
      },
    ],
    [addons, pricingData]
  );

  return (
    <Drawer
      title={`Add Addon`}
      placement="right"
      open={isOpen}
      width={400}
      onClose={handleClose}
      extra={
        <Space>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Form formData={form} formFields={formFields} />
      </Spin>
    </Drawer>
  );
};

export default BatchAddonSidebar;
