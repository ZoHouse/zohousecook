import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidString, isValidUUID } from "@zo/utils/string";
import { Estate, ShowcaseDisplay, Space } from "apps/admin/src/config";

import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Form, FormElement } from "../Form";

interface ShowcaseDisplaySidebarProps {
  open: boolean;
  onClose: () => void;
  displayId: string | null;
  refetch: () => void;
}

const ShowcaseDisplaySidebar: React.FC<ShowcaseDisplaySidebarProps> = ({
  open,
  onClose,
  displayId,
  refetch,
}) => {
  const router = useRouter();
  const [form] = useForm();

  const { estate } = router.query;

  const { data, isLoading: isDisplayLoading } = useQueryApi<ShowcaseDisplay>(
    "CAS_SHOWCASE_DISPLAY",
    {
      enabled: isValidUUID(displayId),
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${displayId}/`
  );

  const { data: estateOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_ESTATES",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((estate: Estate) => ({
          label: estate.name,
          value: estate.id,
        })),
    },
    "",
    "limit=-1"
  );

  const { data: spaceOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_SPACES",
    {
      enabled: isValidString(estate),
      select: (data) =>
        data.data.map((estate: Space) => ({
          value: estate.id,
          label: estate.name,
        })),
    },
    "",
    `floor__estate=${estate}&limit=-1`
  );

  const { mutate, isLoading } = useMutationApi(
    "CAS_SHOWCASE_DISPLAYS",
    {},
    "",
    displayId ? "PUT" : "POST"
  );

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      mutate(
        {
          data: {
            name: values.name,
            space: values.space,
          },
          route: displayId ? `${displayId}/` : "",
        },
        {
          onSuccess: (data) => {
            message.success(
              displayId ? "Display Updated" : "New Display Added"
            );
            refetch();
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
      label: "Name",
      name: "name",
      type: "text",
    },
    {
      label: "Estate",
      name: "estate",
      type: "select",
      options: estateOptions,
      required: true,
      disabled: true,
    },
    {
      label: "Space",
      name: "space",
      type: "select",
      options: spaceOptions,
      required: true,
      disabled: !estate,
    },
  ];

  useEffect(() => {
    if (displayId) {
      form.setFieldsValue({
        name: data?.name,
        space: data?.space.id,
        estate: data?.space?.floor?.estate.id,
      });
    }

    if (estate) {
      form.setFieldsValue({
        estate: estate,
      });
    }
  }, [displayId, data, estate]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add New Display"
      extra={
        <Button onClick={handleSubmit}>
          {displayId ? "Update" : "Create"}
        </Button>
      }
    >
      <Spin spinning={isLoading}>
        <Form formData={form} formFields={formFields} />
      </Spin>
    </Drawer>
  );
};

export default ShowcaseDisplaySidebar;
