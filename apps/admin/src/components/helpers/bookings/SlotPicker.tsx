import { Collapse, Space, Spin, Typography } from "antd";
import { FormInstance, useWatch } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { Form, FormElement as FormElementType } from "../../Form";

const { Panel } = Collapse;
const { Title, Text } = Typography;

interface SlotPickerProps {
  title: string;
  subtitle: string;
  loading?: boolean;
  activeTab: "stay" | "utility";
  form: FormInstance;
  maxOccupancy?: number;
}

const SlotPicker: React.FC<SlotPickerProps> = ({
  title,
  subtitle,
  loading = false,
  activeTab,
  form,
  maxOccupancy = 1,
}) => {
  const timeOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        label: `${i.toString().padStart(2, "0")}:00`,
        value: i.toString(),
      })),
    []
  );

  const timeValue = useWatch("time", form);
  const slotValue = useWatch("slot", form);

  const formFields: FormElementType[] = useMemo(
    () => [
      {
        name: "time",
        label: "Choose Time",
        type: "select",
        options: timeOptions,
        required: true,
      },
      {
        name: "slot",
        label: "Choose Slot",
        type: "radio",
        initialValue: "2",
        options: [
          { label: "2 Hours", value: "2" },
          { label: "8 Hours", value: "8" },
        ],
        required: true,
      },
      {
        name: "members",
        label: "Members",
        required: true,
        type: "spinner",
        minValue: 1,
        maxValue: maxOccupancy,
      },
    ],
    [timeOptions]
  );

  useEffect(() => {
    form.setFieldsValue({
      slot: "2",
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 border border-zui-light mt-2">
        <Spin />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="small" className="mt-6">
      <Typography.Text className="text-base mb-2 font-semibold text-zui-silver uppercase">
        Select Slot For workstation and Studios
      </Typography.Text>
      <Collapse
        className="mt-2"
        bordered={false}
        expandIconPosition="end"
        defaultActiveKey={["1"]}
        items={[
          {
            key: "1",
            label: (
              <div className="flex items-center justify-between">
                <Title level={5} style={{ margin: 0 }}>
                  {title}
                </Title>
                {subtitle && (
                  <Text type="secondary" className="text-sm capitalize">
                    {subtitle}
                  </Text>
                )}
              </div>
            ),
            children: (
              <div className="px-2">
                <Form formData={form} formFields={formFields} />

                {timeValue &&
                  slotValue &&
                  Number(timeValue) + Number(slotValue) > 24 && (
                    <div className="mt-2 text-red-500 text-sm">
                      Note: Slots must be within the same day. If your selected
                      time and duration exceeds 24 hours, please choose another
                      slot.
                    </div>
                  )}
              </div>
            ),
          },
        ]}
      />
    </Space>
  );
};

export default SlotPicker;
