import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, message } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect } from "react";
import { AccessGroup } from "../../config";
import { Form, FormElement } from "../Form";
import { GeneralObject } from "@zo/definitions/general";

interface UserAccessGroupSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup?: string;
  onSuccess: (values: GeneralObject) => void;
}

const UserAccessGroup: React.FC<UserAccessGroupSidebarProps> = ({
  isOpen,
  onClose,
  selectedGroup,
  onSuccess,
}) => {
  const [form] = useForm();

  const { data: accessGroupOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_ACCESSGROUP", {
    select: (data) =>
      data.data.results.map((accessGroup: AccessGroup) => ({
        label: accessGroup.name,
        value: String(accessGroup.id),
      })),
  });
  
  const { mutate: createUserRole } = useMutationApi("CAS_USERACCESSGROUPS");

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      createUserRole(
        {
          data: values,
        },
        {
          onSuccess(data) {
            message.success("User Role Created");
            onSuccess(data.data);
            handleClose();
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
      name: "user_id",
      label: "User",
      type: "searchselect",
      searchQueryApi: "CAS_PROFILES",
      required: true,
      optionValueAndLabelSelector(data) {
        return {
          label: data.nickname || data.name || "Zo User",
          value: data.user.id,
        };
      },
      responseFields: [
        "id",
        "user",
        "nickname",
        "selected_nickname",
        "pfp",
        "pfp_image",
        "pid",
        "first_name",
        "last_name",
        "email_address",
        "wallet_address",
        "avatar",
      ],
    },
    {
      name: "access_group",
      type: "select",
      label: "Access Group",
      options: accessGroupOptions,
      initialValue: selectedGroup,
      disabled: true,
    },
  ];

  useEffect(() => {
    if (isOpen && selectedGroup) {
      form.setFieldsValue({
        access_group: selectedGroup,
      });
    } else {
      form.resetFields();
    }
  }, [isOpen, selectedGroup]);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title="Add new role"
      extra={
        <Button onClick={handleSave} type="primary">
          Save
        </Button>
      }
    >
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default UserAccessGroup;
