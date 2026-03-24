import { GeneralObject } from "@zo/definitions/general";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormValidation } from "@zo/utils/hooks";
import { getChangedFields } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Button, Drawer, message } from "antd";
import { useForm } from "antd/es/form/Form";
import { useMutationApi, useQueryApi } from "libs/auth/src/hooks";
import { useEffect, useMemo } from "react";
import { Profile } from "../../config";
import { Form, FormElement } from "../Form";

interface EditUserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function EditUserSidebar({
  isOpen,
  onClose,
  userId,
}: EditUserSidebarProps) {
  const { data: user } = useQueryApi<Profile>(
    "CAS_PROFILES",
    {
      enabled: isOpen && isValidString(userId),
      refetchOnWindowFocus: false,
      select(data) {
        return data.data;
      },
    },
    `${userId}/`
  );

  const initialValues = useMemo(() => {
    if (user) {
      return {
        nickname: user?.nickname,
        gender: user?.gender,
        first_name: user?.first_name,
        middle_name: user?.middle_name,
        last_name: user?.last_name,
        relationship_status: user?.relationship_status,
        bio: user?.bio,
        tags: user?.tags,
      };
    }
    return {};
  }, [user]);

  const [form] = useForm();

  const { mutate: updateUser, isLoading } = useMutationApi(
    "CAS_PROFILES",
    undefined,
    "",
    "PUT"
  );

  const { data: gendersOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select(data) {
      return data.data.profile.gender.map((gender: string) => ({
        label: formatCapitalize(gender),
        value: gender,
      }));
    },
  });

  const { data: relationshipStatusOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select(data) {
      return data.data.profile.relationship_status.map((status: string) => ({
        label: formatCapitalize(status),
        value: status,
      }));
    },
  });

  const { data: tagOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_TAGS",
    {
      enabled: true,
      refetchOnWindowFocus: false,
      select(data) {
        return data.data.map((tag: GeneralObject) => ({
          label: formatCapitalize(tag.slug),
          value: tag.slug,
        }));
      },
    },
    "",
    "limit=-1"
  );

  const handleSave = () => {
    const changedData = getChangedFields(initialValues, form.getFieldsValue());
    updateUser(
      {
        data: changedData,
        route: `${userId}/`,
      },
      {
        onSuccess() {
          message.success("User Updated");
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const formFields: FormElement[] = [
    {
      name: "nickname",
      label: "Nickname",
      type: "text",
    },
    {
      name: "first_name",
      label: "First Name",
      type: "text",
    },
    {
      name: "middle_name",
      label: "Middle Name",
      type: "text",
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
    },
    {
      name: "tags",
      label: "Tags",
      type: "multiSelect",
      options: tagOptions,
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: gendersOptions,
    },
    {
      name: "relationship_status",
      label: "Relationship Status",
      type: "select",
      options: relationshipStatusOptions,
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const { hasFormDataChanged } = useFormValidation(
    form,
    formFields as FormElementType[],
    initialValues
  );
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  return (
    <Drawer
      title="Edit User"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      extra={
        <Button
          type="primary"
          onClick={handleSave}
          disabled={!hasFormDataChanged}
          loading={isLoading}
        >
          Save
        </Button>
      }
    >
      <Form formFields={formFields} formData={form} />
    </Drawer>
  );
}
