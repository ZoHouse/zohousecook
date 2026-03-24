import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { CancellationPolicyResponse } from "../../../config/typings";
import { Form, FormElement } from "../../Form";

interface PartnerCancellationPolicyProps {
  isOpen: boolean;
  cancellationPolicyId?: string | null;
  onClose: () => void;
  operatorId?: string;
  refetch: () => void;
}

const PartnerCancellationPolicy: React.FC<PartnerCancellationPolicyProps> = ({
  isOpen,
  cancellationPolicyId,
  onClose,
  operatorId,
  refetch,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();

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
        operator: cancellationPolicy.operator?.id,
        start_at:
          cancellationPolicy.start_at && dayjs(cancellationPolicy.start_at),
        end_at: cancellationPolicy.end_at && dayjs(cancellationPolicy.end_at),
        min_hours_till_start: cancellationPolicy.min_hours_till_start
          ? cancellationPolicy.min_hours_till_start / 24
          : null,
        max_hours_till_start: cancellationPolicy.max_hours_till_start
          ? cancellationPolicy.max_hours_till_start / 24
          : null,
      };
    } else {
      return {};
    }
  }, [cancellationPolicy]);

  const formFields: FormElement[] = [
    {
      name: "status",
      label: "Status",
      type: "select",
      options: policyStatusOptions,
    },
    {
      name: "start_at",
      label: "Starts At",
      type: "datetime",
    },
    {
      name: "end_at",
      label: "Ends At",
      type: "datetime",
    },
    {
      name: "min_hours_till_start",
      label: "Min Days Before Start",
      type: "number",
    },
    {
      name: "max_hours_till_start",
      label: "Max Days Before Start",
      type: "number",
    },
    {
      name: "cancellation_charge",
      label: "Cancellation Charge %",
      type: "number",
      required: true,
      maxValue: 100,
      minValue: 0,
    },
  ];

  const handleSave = () => {
    form.validateFields().then((values) => {
      const _data = form.getFieldsValue();
      const payload = {
        ..._data,
        min_hours_till_start: values.min_hours_till_start * 24,
        max_hours_till_start: values.max_hours_till_start * 24,
        operator: operatorId,
      };

      const route = isValidUUID(cancellationPolicyId)
        ? `${cancellationPolicyId}/`
        : ``;

      mutateCancellationPolicy(
        { data: payload, route },
        {
          onSuccess() {
            message.success("Cancellation Policy Updated");
            queryClient.invalidateQueries(["cas", "cancellation-policy"]);
            refetch();
            handleClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
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

export default PartnerCancellationPolicy;
