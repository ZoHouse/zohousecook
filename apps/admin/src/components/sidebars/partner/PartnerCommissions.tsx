import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidUUID } from "@zo/utils/string";
import { Button, Drawer, message, Spin } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Currency, PartnerCommission } from "../../../config/typings";
import { Form, FormElement } from "../../Form";

interface PartnerCommissionsProps {
  isOpen: boolean;
  commissionId?: string | null;
  onClose: () => void;
  operatorId?: string;
  refetch: () => void;
  currency: Currency;
}

const PartnerCommissionsSidebar: React.FC<PartnerCommissionsProps> = ({
  isOpen,
  commissionId,
  onClose,
  operatorId,
  refetch,
  currency,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();

  const { mutate: UpdateCommission, isLoading: isUpdating } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    `${isValidUUID(commissionId) ? "PUT" : "POST"}`
  );

  const { data: commission, isLoading: isLoadingCommission } =
    useQueryApi<PartnerCommission>(
      "CAS_OPERATORS",
      {
        enabled: isOpen && isValidUUID(commissionId),
        select: (data) => data.data,
        refetchOnWindowFocus: false,
      },
      `${operatorId}/commissions/${commissionId}/`
    );

  const { data: commissionStatusOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: isOpen,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.commission.status.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: commissionTypeOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: isOpen,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.commission.commission_type.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const formattedData = useMemo(() => {
    if (commission) {
      return {
        status: commission?.status,
      };
    } else {
      return {};
    }
  }, [commission]);

  const commissionType = useWatch("commission_type", form);

  const formFields: FormElement[] = useMemo(
    () => [
      {
        name: "status",
        label: "Status",
        type: "select",
        options: commissionStatusOptions,
        required: true,
      },
      {
        name: "title",
        label: "Title",
        type: "text",
        isHidden: isValidUUID(commissionId),
      },
      {
        name: "commission_type",
        label: "Commission Type",
        type: "select",
        required: true,
        options: commissionTypeOptions,

        isHidden: isValidUUID(commissionId),
      },
      {
        name: "amount",
        label: "Amount",
        type: "price",
        required: true,
        currency: currency,

        isHidden:
          commissionType === "percentage" ||
          commissionType === undefined ||
          isValidUUID(commissionId),
      },
      {
        name: "percent_amount",
        label: "Percent Amount",
        type: "number",
        required: true,
        isHidden:
          commissionType === "fixed" ||
          commissionType === undefined ||
          isValidUUID(commissionId),
      },

      {
        name: "applicable_from",
        label: "Applicable From",
        type: "datetime",
        required: true,
        minDate: new Date(),
        isHidden: isValidUUID(commissionId),
      },
      {
        name: "applicable_till",
        label: "Applicable Till",
        type: "datetime",
        required: true,
        isHidden: isValidUUID(commissionId),
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
    [
      currency,
      commissionType,
      commissionId,
      commissionStatusOptions,
      commissionTypeOptions,
    ]
  );

  const handleSave = () => {
    form.validateFields().then((values) => {
      const _data = form.getFieldsValue();
      const payload = {
        ..._data,
        currency: "INR",
      };

      const route = isValidUUID(commissionId)
        ? `${operatorId}/`
        : `${operatorId}/commissions/`;

      UpdateCommission(
        { data: payload, route },
        {
          onSuccess() {
            message.success("Commission Updated");
            queryClient.invalidateQueries(["cas", "operators"]);
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
    if (isValidUUID(commissionId) && isValidObject(formattedData)) {
      form.setFieldsValue(formattedData);
    } else {
      form.resetFields();
    }
  }, [isOpen, formattedData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={commissionId ? "Edit Commission" : "Add Commission"}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Spin spinning={isUpdating || isLoadingCommission}>
        <Form
          formData={form}
          formFields={formFields}
          initialValues={formattedData}
        />
      </Spin>
    </Drawer>
  );
};

export default PartnerCommissionsSidebar;
