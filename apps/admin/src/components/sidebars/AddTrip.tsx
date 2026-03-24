import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { App, Button, Drawer, Space, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import React from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

interface AddTripProps {
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
}

const AddTrip: React.FC<AddTripProps> = ({ isOpen, onClose, refetch }) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { mutate: createTrip, isLoading } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "POST"
  );

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleCreateTrip = async () => {
    const _data = form.getFieldsValue();
    const payload = {
      ..._data,
      type: "trip",
      operator: process.env.TRIP_OPERATOR_ID,
      tax_category: "package",
      category: "fixed-itinerary",
      status: "inactive",
    };
    createTrip(
      {
        data: payload,
      },
      {
        onSuccess(data) {
          queryClient.invalidateQueries({
            queryKey: ["cas", "inventory"],
          });
          message.success("Trip created successfully");
          handleClose();
          refetch?.();
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
  ];

  return (
    <Drawer
      onClose={handleClose}
      open={isOpen}
      title="Add Trip Info"
      placement="right"
      width={500}
      extra={
        <Space>
          <Button type="primary" onClick={handleCreateTrip}>
            Add New Trip
          </Button>
        </Space>
      }
    >
      {!isLoading ? (
        <div className="py-4">
          <Form formData={form} formFields={formFields} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" tip="Creating Trip..." />
        </div>
      )}
    </Drawer>
  );
};

export default AddTrip;
