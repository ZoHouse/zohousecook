import { EyeOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { isValidUUID } from "@zo/utils/string";
import { App, Button, Drawer, Popover, Space } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import { useQueryClient } from "react-query";
import rehypeRaw from "rehype-raw";
import { Form, FormElement } from "../Form";

interface TripItineraryStopDetailSidebarProps {
  data: any;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  selectedItinerary: any;
}

const TripItineraryStopDetailSidebar: React.FC<
  TripItineraryStopDetailSidebarProps
> = ({ data, isOpen, onClose, refetch, selectedItinerary }) => {
  const formatTime = (time: any) => {
    if (!time) return null;
    const timeObj = dayjs(time);
    return timeObj.isValid() ? timeObj.format("HH:mm:ss") : null;
  };

  const formatInitialTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    return dayjs(timeStr, "HH:mm:ss");
  };
  const queryClient = useQueryClient();
  const [form] = useForm();
  const { message } = App.useApp();

  const [showPreview, setShowPreview] = useState(false);

  const { mutate: updateItinerary } = useMutationApi(
    "CAS_ITINERARY_STOPS",
    {},
    "",
    `${data === 0 ? "POST" : "PUT"}`
  );

  const initialValues = useMemo(() => {
    if (data) {
      return {
        day: data.day,
        title: data.title,
        description: data.description,
        start_at: data.start_at ? formatInitialTime(data.start_at) : null,
        end_at: data.end_at ? formatInitialTime(data.end_at) : null,
      };
    } else {
      return {};
    }
  }, [data]);

  useEffect(() => {
    if (isValidUUID(data?.id) && isValidObject(initialValues)) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isOpen, initialValues]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      const _data = form.getFieldsValue();
      const payload = {
        ..._data,
        start_at: _data.start_at ? formatTime(_data.start_at) : null,
        end_at: _data.end_at ? formatTime(_data.end_at) : null,
        itinerary: selectedItinerary,
      };
      const successMessage =
        data !== 0 ? "Itinerary Stop Updated" : "Itinerary Stop Created";

      const route = data !== 0 ? `${data.id}/` : ``;

      updateItinerary(
        { data: payload, route },
        {
          onSuccess() {
            message.success(successMessage);
            queryClient.invalidateQueries(["cas", "itinerary-stops"]);
            refetch();
            handleClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const formFields: FormElement[] = [
    {
      name: "day",
      label: "Days",
      type: "number",
      required: true,
    },
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
      name: "start_at",
      label: "Start At",
      type: "time",
    },
    {
      name: "end_at",
      label: "End At",
      type: "time",
      rules: [
        {
          validator: (_, value) => {
            const startTime = form.getFieldValue("start_at");
            if (startTime && value) {
              if (dayjs(value).isBefore(dayjs(startTime))) {
                return Promise.reject(
                  "End time must be greater than start time"
                );
              }
            }
            return Promise.resolve();
          },
        },
      ],
    },
  ];

  return (
    <Drawer
      title={data !== 0 ? "Update itinerary" : "Add new itinerary"}
      placement="right"
      open={isOpen}
      width={400}
      onClose={handleClose}
      extra={
        <Space>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </Space>
      }
    >
      <Form
        formData={form}
        formFields={formFields}
        initialValues={initialValues}
      />
      <Popover
        content={
          <div className="w-80">
            <div className="font-semibold text-xl mb-2">Markdown Guide:</div>
            <hr className="horizontal-divider mt-4" />
            <div className="space-y-3 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <code className="bg-zui-lighter px-2 py-1 rounded">
                    # Heading
                  </code>
                  <span className="text-zui-silver">Large Heading</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-zui-lighter px-2 py-1 rounded">
                    ## Heading
                  </code>
                  <span className="text-zui-silver">Medium Heading</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-zui-lighter px-2 py-1 rounded">
                    **Text**
                  </code>
                  <span className="text-zui-silver">Bold Text</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-zui-lighter px-2 py-1 rounded">
                    *Text*
                  </code>
                  <span className="text-zui-silver">Italic Text</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-zui-lighter px-2 py-1 rounded">
                    - List item
                  </code>
                  <span className="text-zui-silver">Bullet List</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-zui-lighter px-2 py-1 rounded">
                    [Text](url)
                  </code>
                  <span className="text-zui-silver">Link</span>
                </div>
              </div>
            </div>
          </div>
        }
        trigger="click"
        placement="left"
      >
        <Button size="small" type="text" icon={<QuestionCircleOutlined />}>
          Markdown Guide
        </Button>
      </Popover>
      <Button
        type="default"
        onClick={() => setShowPreview(!showPreview)}
        icon={<EyeOutlined />}
        className="my-6"
      >
        {showPreview ? "Hide Description Preview" : "Show Description Preview"}
      </Button>
      {showPreview && (
        <div className="border border-zui-silver overflow-hidden">
          <div className="px-4 py-2 text-sm font-medium">Preview</div>
          <hr className="horizontal-divider mt-4" />
          <div className="p-4 prose max-w-none">
            <Markdown
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mb-3">{children}</h2>
                ),
                p: ({ children }) => <p className="mb-4">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-bold">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-4">{children}</ul>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                a: ({ children, href }) => (
                  <a href={href} className="text-zui-blue hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {form.getFieldValue("description")}
            </Markdown>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default TripItineraryStopDetailSidebar;
