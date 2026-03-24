import { TagsOutlined } from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/router";
import React from "react";
import { Form, FormElement } from "../Form";

interface AddTripFeaturedTagProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const AddTripFeaturedTag: React.FC<AddTripFeaturedTagProps> = ({
  isOpen,
  onClose,
  refetch,
}) => {
  const router = useRouter();

  const [form] = useForm();

  const { mutate: createFeaturedTag, isLoading } = useMutationApi(
    "CAS_FEATURED_TAGS",
    {},
    "",
    "POST"
  );

  const formFields: FormElement[] = [
    {
      name: "tag",
      label: "Tag",
      type: "searchselect",
      searchQueryApi: "CAS_TAGS",
      required: true,
      selectedValueSelector: (data) => data?.id,
      optionValueAndLabelSelector: (data) => ({
        value: data.id,
        label: data.slug,
      }),
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleFeaturedTag = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        category: "trip",
        tag: values.tag,
      };

      createFeaturedTag(
        { data: payload },
        {
          onSuccess: () => {
            message.success("Featured tag created successfully");
            handleClose();
            refetch();
          },
          onError: (error) => {
            message.error(processResponseError(error));
          },
        }
      );
    } catch (error) {
      message.error(processResponseError(error));
    }
  };

  const handleShowTags = () => {
    router.push("/misc/tags");
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Add Featured Tag"
      placement="right"
      extra={
        <Button type="primary" onClick={handleFeaturedTag} disabled={isLoading}>
          Add
        </Button>
      }
      footer={
        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<TagsOutlined />}
            onClick={handleShowTags}
            className="bg-zui-neon text-zui-dark hover:bg-zui-neon/80"
          >
            All Tags
          </Button>
        </div>
      }
    >
      <Spin spinning={isLoading} tip="Creating...">
        <div className="py-4">
          <Form formData={form} formFields={formFields} />
        </div>
      </Spin>
    </Drawer>
  );
};

export default AddTripFeaturedTag;
