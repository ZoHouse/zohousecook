import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { CommsApplication, CommsThread } from "../../config/typings";
import { Form, FormElement } from "../Form";

interface ThreadInfoProps {
  isOpen: boolean;
  threadId: string | null;
  onClose: () => void;
}

const ThreadInfo: React.FC<ThreadInfoProps> = ({
  threadId,
  onClose,
  isOpen,
}) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { mutate } = useMutationApi("CAS_COMMS_THREADS", {}, "", "PUT");

  const { data: thread } = useQueryApi<CommsThread>(
    "CAS_COMMS_THREADS",
    {
      enabled: isValidString(threadId),
      refetchOnWindowFocus: false,
      select: (data: GeneralObject) => data.data,
    },
    `${threadId}/`,
    ""
  );

  const { data: applicationOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_COMMS_APPLICATIONS",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((application: CommsApplication) => ({
          label: application.name,
          value: application.id,
        })),
    },
    "",
    "limit=50"
  );

  const initialData: CommsThread | GeneralObject = useMemo(() => {
    return isValidObject(thread)
      ? {
          title: thread?.title,
          description: thread?.description,
          category: thread?.category,
          application: thread?.application.id,
          icon: thread?.icon,
        }
      : {};
  }, [thread]);

  const [form] = useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      mutate(
        {
          data: values,
          route: `${threadId}/`,
        },
        {
          onSuccess: (data: GeneralObject) => {
            message.success("Updated successfully.");
            queryClient.invalidateQueries(["cas", "comms", "threads"]);
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
      name: "title",
      label: "Title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "text",
      initialValue: "group-chat",
      disabled: true,
    },
    {
      name: "application",
      dataSelector: (data) => data?.id,
      label: "Application",
      type: "select",
      options: applicationOptions,
      required: true,
    },
    {
      name: "icon",
      label: "Icon",
      type: "mediaLinkGenerator",
      required: true,
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (isValidString(threadId) && isValidObject(initialData)) {
      form.setFieldsValue(initialData);
    }
  }, [threadId, initialData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={threadId ? "Update Thread" : "Add a New Thread"}
      extra={<Button onClick={handleSubmit}>Save</Button>}
    >
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default ThreadInfo;
