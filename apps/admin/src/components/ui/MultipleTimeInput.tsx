import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { cn } from "@zo/utils/font";
import { Button, TimePicker, Typography } from "antd";
import dayjs from "dayjs";
import React from "react";

interface MultipleTimeInputProps {
  label: string;
  timings: string[];
  setTimings: React.Dispatch<any>;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue?: any;
}

const MultipleTimeInput: React.FC<MultipleTimeInputProps> = ({
  label,
  name,
  setTimings,
  timings,
  disabled,
  initialValue,
  required,
}) => {
  const handleRemoveTiming = (index: number) => {
    setTimings(timings.filter((_, i) => i !== index));
  };

  const handleTimingChange = (index: number, time: dayjs.Dayjs | null) => {
    const newTime = time ? time.format("HH:mm") : "";
    setTimings(timings.map((t, i) => (i === index ? newTime : t)));
  };

  const handleAddTiming = () => {
    setTimings([...timings, ""]);
  };

  return (
    <div className="flex flex-col gap-2">
      {timings.map((timing: string, index: number) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-between border border-zui-lightest p-4",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Typography.Text className="text-gray-700">
            {label} {required && <span className="text-zui-red">*</span>}
          </Typography.Text>

          <div className="flex items-center gap-2">
            <TimePicker
              value={timing ? dayjs(timing, "HH:mm") : null}
              onChange={(time) => handleTimingChange(index, time)}
              format="HH:mm"
              disabled={disabled}
              className="w-32"
              placeholder="Select time"
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveTiming(index)}
              disabled={disabled}
              danger
            />
          </div>
        </div>
      ))}

      <Button
        type="text"
        icon={<PlusOutlined />}
        onClick={handleAddTiming}
        disabled={disabled}
        className="self-end text-zui-neon"
      >
        Add timing
      </Button>
    </div>
  );
};

export default MultipleTimeInput;
