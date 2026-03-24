import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/router";
import React from "react";
import { Currency, Estate, ZoHouse } from "../../config";
import { areRequiredFieldsPresent } from "../../utils";
import { Form, FormElement } from "../Form";

interface AddHouseProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const AddHouse: React.FC<AddHouseProps> = ({ isOpen, onClose, refetch }) => {
  const router = useRouter();

  const [form] = useForm();

  const { mutate: createOperator, isLoading: isCreatingOperator } =
    useMutationApi("CAS_OPERATORS");
  const { mutate: createEstate, isLoading: isCreatingEstate } = useMutationApi(
    "CAS_ESTATE",
    {},
    "",
    "POST"
  );

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
        return data?.name;
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

  const handleCreateEstate = () => {
    createEstate(
      {
        data: {
          name: form.getFieldValue("name"),
        },
      },
      {
        onSuccess(data) {
          const estateData: Estate = data.data;
          handleCreateOperator(form.getFieldsValue(), estateData.id);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleCreateOperator = async (
    data: GeneralObject,
    estateId: string
  ) => {
    await createOperator(
      {
        data: {
          name: form.getFieldValue("name"),
          currency: form.getFieldValue("currency"),
          destination: form.getFieldValue("destination"),
          status: "inactive",
          estate: estateId,
        },
      },
      {
        onSuccess: (data) => {
          const zoHouseDetails: ZoHouse = data.data;
          handleClose();
          refetch();
          router.replace(`${zoHouseDetails.id}/edit`);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const isSubmitting = isCreatingOperator || isCreatingEstate;

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Add House Info"
      placement="right"
      extra={[
        <Button
          key="create"
          type="primary"
          onClick={handleCreateEstate}
          disabled={
            !areRequiredFieldsPresent(
              formFields as FormElementType[],
              form.getFieldsValue()
            )
          }
        >
          Create House
        </Button>,
      ]}
    >
      {!isSubmitting ? (
        <div className="py-4">
          <Form formData={form} formFields={formFields} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" tip="Creating house..." />
        </div>
      )}
    </Drawer>
  );
};

export default AddHouse;
