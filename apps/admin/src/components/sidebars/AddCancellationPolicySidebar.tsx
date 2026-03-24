import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize, isValidString, isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message, Spin } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import {
  CancellationPolicyResponse,
  Inventory,
  ZoHouse,
} from "../../config/typings";
import { Form, FormElement } from "../Form";
import { isValidObject } from "@zo/utils/object";

interface AddCancellationPolicySidebarProps {
  isOpen: boolean;
  cancellationPolicyId?: string | null;
  onClose: () => void;
}

const AddCancellationPolicySidebar: React.FC<
  AddCancellationPolicySidebarProps
> = ({ isOpen, cancellationPolicyId, onClose }) => {
  const queryClient = useQueryClient();
  const [form] = useForm();

  const selectedOperator = useWatch("operator", form);

  const { mutate: mutateCancellationPolicy, isLoading: isUpdating } =
    useMutationApi(
      "CAS_CANCELLATION_POLICY",
      {},
      "",
      `${isValidUUID(cancellationPolicyId) ? "PUT" : "POST"}`
    );

  const { data: cancellationPolicy, isLoading: isLoadingCancellationPolicy } =
    useQueryApi<CancellationPolicyResponse>(
      "CAS_CANCELLATION_POLICY",
      {
        enabled: isOpen && isValidUUID(cancellationPolicyId),
        select: (data) => data.data,
        refetchOnWindowFocus: false,
      },
      `${cancellationPolicyId}/`
    );

  const { data: policyStatusOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: isOpen,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.cancellation_policy.status.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const formattedData = useMemo(() => {
    if (cancellationPolicy) {
      return {
        ...cancellationPolicy,
        inventory: cancellationPolicy.operator
          ? cancellationPolicy.inventory?.id
          : cancellationPolicy.inventory,
        operator: cancellationPolicy.operator?.id,
        start_at: cancellationPolicy.start_date
          ? dayjs(cancellationPolicy.start_date)
          : null,
        end_at: cancellationPolicy.end_date
          ? dayjs(cancellationPolicy.end_date)
          : null,
      };
    } else {
      return {};
    }
  }, [cancellationPolicy]);

  const { data: operatorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_OPERATORS",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((operator: ZoHouse) => ({
          value: operator.id,
          label: operator.name,
        })),
    },
    "",
    "fields=id,name&limit=-1"
  );
  const { data: inventoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_INVENTORY",
    {
      enabled: isValidString(selectedOperator) && isOpen,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((inventory: Inventory) => ({
          value: inventory.id,
          label: inventory.name,
        })),
    },
    "",
    selectedOperator
      ? `operator=${selectedOperator}&status=active&fields=id,name&limit=-1`
      : "limit=-1"
  );

  const formFields: FormElement[] = [
    {
      name: "operator",
      label: "Operator",
      type: "select",
      options: operatorOptions,
    },
    {
      name: "inventory",
      label: "Inventory",
      type: "select",
      options: inventoryOptions,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: policyStatusOptions,
    },
    {
      name: "icon",
      label: "Icon",
      type: "emojiPicker",
    },
    {
      name: "start_at",
      label: "Start At",
      type: "datetime",
    },
    {
      name: "end_at",
      label: "End At",
      type: "datetime",
    },
    {
      name: "min_hours_till_start",
      label: "Min Hours Before Start",
      type: "number",
    },
    {
      name: "max_hours_till_start",
      label: "Max Hours Before Start",
      type: "number",
    },
    {
      name: "cancellation_charge",
      label: "Cancellation Charge",
      type: "number",
      required: true,
    },
  ];

  const handleSave = () => {
    const _data = form.getFieldsValue();
    const body = {
      ..._data,
      start_at: _data.start_at
        ? dayjs(_data.start_at).format("YYYY-MM-DDTHH:mm:ssZ")
        : dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      end_at: _data.end_at
        ? dayjs(_data.end_at).format("YYYY-MM-DDTHH:mm:ssZ")
        : dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      icon: _data.icon || "😊",
    };

    if (_data.inventory && typeof _data.inventory !== "string") {
      body.inventory = _data.inventory.id;
    }

    const route = isValidUUID(cancellationPolicyId)
      ? `${cancellationPolicyId}/`
      : ``;

    mutateCancellationPolicy(
      { data: body, route },
      {
        onSuccess() {
          message.success("Cancellation Policy Updated");
          queryClient.invalidateQueries(["cas", "cancellation-policy"]);
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (isValidUUID(cancellationPolicyId) && isValidObject(formattedData)) {
      form.setFieldsValue(formattedData);
    } else {
      form.resetFields();
    }
  }, [isOpen, formattedData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={
        cancellationPolicyId
          ? "Edit Cancellation Policy"
          : "Add Cancellation Policy"
      }
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Spin spinning={isUpdating || isLoadingCancellationPolicy}>
        <Form
          formData={form}
          formFields={formFields}
          initialValues={formattedData}
        />
      </Spin>
    </Drawer>
  );
};

export default AddCancellationPolicySidebar;
