import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidString } from "@zo/utils/string";
import { Button, Drawer, Empty, message } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect } from "react";
import { Destination } from "../../config";
import { Form, FormElement } from "../Form";

interface AddTripDestinationProps {
  open: boolean;
  onClose: () => void;
  destinations: Destination[];
  tripId: string;
  refetch: () => void;
}

const AddTripDestination: React.FC<AddTripDestinationProps> = ({
  open,
  onClose,
  destinations,
  tripId,
  refetch,
}) => {
  const [form] = useForm();

  const { mutate: updateDestinations } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "POST"
  );

  const formFields: FormElement[] = [
    {
      name: "destination",
      label: "Destination",
      type: "searchMultiSelect",
      searchQueryApi: "CAS_DESTINATIONS",
      responseFields: ["id", "name"],
      required: true,
      optionValueAndLabelSelector: (data) => ({
        value: data.id,
        label: data.name,
      }),
      customSearchQuery: "internally_managed=0",
      notFoundContent: <Empty description="No destinations found" />,
      options:
        destinations && destinations.length > 0
          ? destinations.map((destination) => ({
              value: destination.id,
              label: destination.name,
            }))
          : [],
    },
  ];

  /** Add destination */
  const handleAddDestination = () => {
    if (!isValidString(tripId)) {
      message.error("Trip ID is required");
      return;
    }

    form.validateFields().then((values) => {
      const destinationIds: string[] = values.destination || [];

      const _body = destinationIds.map((id, index) => ({
        id,
        sort_index: destinationIds.length - index,
      }));

      updateDestinations(
        {
          data: { destinations: _body },
          route: `${tripId}/destinations/`,
        },
        {
          onSuccess() {
            message.success("Destinations Added!");
            onClose();
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  useEffect(() => {
    if (destinations.length > 0) {
      const destinationIds = destinations.map((destination) => destination.id);
      form.setFieldsValue({
        destination: destinationIds,
      });
    }
  }, [destinations]);

  return (
    <Drawer
      title="Add Destinations"
      open={open}
      onClose={onClose}
      extra={
        <Button type="primary" onClick={handleAddDestination}>
          Add
        </Button>
      }
    >
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default AddTripDestination;
