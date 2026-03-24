import { useMutationApi, useQueryApi } from "@zo/auth";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/router";
import React from "react";
import { Currency, Estate, Operator } from "../../config";
import { areRequiredFieldsPresent } from "../../utils";
import { Form, FormElement } from "../Form";

interface AddPartnerProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const AddPartner: React.FC<AddPartnerProps> = ({
  isOpen,
  onClose,
  refetch,
}) => {
  const router = useRouter();

  const [form] = useForm();

  const { mutate: createOperator, isLoading: isCreatingOperator } =
    useMutationApi("CAS_OPERATORS");

  const { data: currencyOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_CURRENCY",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((estate: Currency) => ({
          label: estate.name,
          value: estate.id,
        })),
    },
    "",
    "limit=-1"
  );

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "destination",
      label: "City",
      type: "searchselect",
      searchQueryApi: "CAS_DESTINATIONS",
      required: true,

      selectedValueSelector(data) {
        return data?.id;
      },
    },
    {
      name: "currency",
      label: "Currency",
      type: "select",
      options: currencyOptions,
      required: true,
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleCreateOperator = () => {
    createOperator(
      {
        data: {
          name: form.getFieldValue("name"),
          currency: form.getFieldValue("currency"),
          destination: form.getFieldValue("destination"),
          status: "inactive",
        },
      },
      {
        onSuccess: (data) => {
          const partnerDetails: Operator = data.data;
          handleClose();
          refetch();
          router.replace(`${partnerDetails.id}/`);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Add Partner Info"
      placement="right"
      extra={[
        <Button
          key="create"
          type="primary"
          onClick={handleCreateOperator}
          disabled={
            !areRequiredFieldsPresent(
              formFields as FormElementType[],
              form.getFieldsValue()
            )
          }
        >
          Create Partner
        </Button>,
      ]}
    >
      {!isCreatingOperator ? (
        <div className="py-4">
          <Form formData={form} formFields={formFields} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" tip="Creating Partner..." />
        </div>
      )}
    </Drawer>
  );
};

export default AddPartner;
