import SaveIcon from "@mui/icons-material/Save";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { Button, Drawer, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import React, { useMemo } from "react";
import { useQueryClient } from "react-query";
import { Currency } from "../../config";
import { Form, FormElement } from "../Form";
import { CustomTicket } from "./AddEvent";

interface TicketSidebarProps {
  edit?: boolean;
  data?: GeneralObject | null;
  ticketId?: string;
  isOpen: boolean;
  onClose: () => void;
  addTicket?: (ticket: CustomTicket, editMode?: boolean) => void;
  currency?: Currency;
}

const TicketSidebar: React.FC<TicketSidebarProps> = ({
  data,
  edit,
  isOpen,
  ticketId,
  onClose,
  currency,
  addTicket,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();
  const hasInfiniteUnits = useWatch("hasInfiniteUnits", form);

  const { mutate: updateTicket } = useMutationApi("CAS_SKU", {}, "", "PUT");

  const ticketFormattedData = useMemo(() => {
    if (data && isValidObject(data) && isValidString(ticketId)) {
      return {
        ...data,
        location: data.space?.id,
        hasInfiniteUnits: data.has_infinite_units,
      };
    }
    return {
      hasInfiniteUnits: true,
    };
  }, [data]);

  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (ticketId) {
        updateTicket(
          {
            data: {
              name: values.name,
              price: +values.price,
              units: +values.units || 0,
              has_infinite_units: values.hasInfiniteUnits || false,
            },
            route: `${ticketId}/`,
          },
          {
            onError(error) {
              message.error(processResponseError(error));
            },
            onSuccess() {
              message.success("Updated Successfully");
              queryClient.invalidateQueries(["cas", "sku"]);
            },
          }
        );
      } else if (addTicket) {
        addTicket({
          id:
            edit && data
              ? data.id
              : Math.floor(Math.random() * 1000).toString(),
          name: values.name,
          price: values.price || 0,
          units: values.units || 0,
          location: values.location,
          hasInfiniteUnits: values.hasInfiniteUnits,
        });
      }
      handleClose();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Ticket Name",
      type: "text",
      rules: [{ required: true, message: "Please enter ticket name" }],
    },
    {
      name: "price",
      label: "Price per person",
      type: "price",
      currency: currency,
    },
    {
      name: "hasInfiniteUnits",
      label: "Has Infinite Units",
      type: "checkbox",
      initialValue: true,
    },
    {
      name: "units",
      label: "No of Tickets",
      rules: [{ required: true, message: "Please enter number of tickets" }],
      type: "number",
      isHidden: hasInfiniteUnits,
    },
  ];

  return (
    <Drawer
      title={data ? "Update Tickets" : "Add Tickets"}
      open={isOpen}
      onClose={handleClose}
      extra={
        <Button
          type="primary"
          onClick={handleSave}
          icon={<SaveIcon fontSize="small" />}
        >
          Save
        </Button>
      }
    >
      <Form
        formData={form}
        formFields={formFields}
        initialValues={ticketFormattedData}
      />
    </Drawer>
  );
};

export default TicketSidebar;
