import { useAuth, useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidEmail } from "@zo/utils/string";
import { isValidAddress } from "@zo/utils/web3";
import { Button, Drawer, message, Spin } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import React from "react";
import { useQueryClient } from "react-query";
import { Estate } from "../../config";
import { Form, FormElement } from "../Form";
interface AddInvitationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const userViaOptions = [
  { label: "Email", value: "email" },
  { label: "Wallet", value: "wallet" },
];

const AddInvitationSidebar: React.FC<AddInvitationSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();
  const { user } = useAuth();
  const userInvitedVia = useWatch("userVia", form);

  const { data: estateOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_ESTATES",
    {
      enabled: isOpen,
      select: (data) =>
        data.data.results.map((estate: Estate) => ({
          label: estate.name,
          value: estate.id,
        })),
    },
    "",
    "limit=100"
  );

  const { mutate: createInvitation, isLoading } = useMutationApi("CAS_INVITES");

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (values.userVia === "email" && !isValidEmail(values.email_address)) {
        message.error("Please enter a valid email address");
        return;
      }
      if (
        values.userVia === "wallet" &&
        !isValidAddress(values.wallet_address)
      ) {
        message.error("Please enter a valid wallet address");
        return;
      }

      createInvitation(
        {
          data: {
            ...values,
            valid_from: values.valid_from
              ? values.valid_from
              : dayjs(new Date()).toISOString(),
            valid_till: values.valid_till
              ? values.valid_till
              : dayjs().add(1, "week").toISOString(),
            invited_by: user?.id,
          },
        },
        {
          onSuccess() {
            message.success("Invitation Created");
            queryClient.invalidateQueries(["cas", "invites"]);
            form.resetFields();
            onClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const formFields: FormElement[] = [
    {
      name: "first_name",
      type: "text",
      label: "First Name",
      required: true,
    },
    {
      name: "last_name",
      type: "text",
      label: "Last Name",
    },
    {
      name: "estate",
      type: "select",
      label: "Estate",
      options: estateOptions,
      required: true,
    },
    {
      name: "valid_from",
      type: "datetime",
      label: "Valid From",
      required: true,
    },
    {
      name: "valid_till",
      type: "datetime",
      label: "Valid Till",
    },

    {
      name: "userVia",
      type: "select",
      label: "Add User Via",
      initialValue: "email",
      options: userViaOptions,
      required: true,
    },

    {
      name: "email_address",
      required: userInvitedVia === "email",
      type: "email",
      label: "Email",
      isHidden: userInvitedVia != "email",
    },
    {
      name: "wallet_address",
      required: userInvitedVia === "wallet",
      type: "text",
      label: "Wallet Address",
      isHidden: userInvitedVia != "wallet",
    },
    {
      name: "reason",
      type: "textarea",
      label: "Reason",
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Add a New Invitation"
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Spin spinning={isLoading}>
        <Form formData={form} formFields={formFields} />
      </Spin>
    </Drawer>
  );
};
export default AddInvitationSidebar;
