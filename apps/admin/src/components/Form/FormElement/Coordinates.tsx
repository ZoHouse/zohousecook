/* eslint-disable @typescript-eslint/no-explicit-any */
import { InputNumber, Space } from "antd";
import React, { useEffect } from "react";

interface Coordinates {
  type: string;
  coordinates: [number, number];
}
interface InputProps {
  label: string;
  value: any;
  setValue: React.Dispatch<any>;
  name: string;
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  size?: "small" | "middle" | "large";
  status?: "error" | "warning";
}

const Coordinates: React.FC<InputProps> = ({
  value,
  setValue,
  name,
  label,
  initialValue,
  required,
  disabled,
  max = Infinity,
  min = -Infinity,
  placeholder,
  size,
  status,
}) => {
  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue);
    }
  }, [initialValue, value, setValue]);

  const handleChange = (val: number | null, coordinateType: "X" | "Y") => {
    if (val !== null) {
      const currentCoordinates = value?.coordinates || [0, 0];

      setValue({
        ...value,
        type: "Point",
        coordinates:
          coordinateType === "X"
            ? [val, currentCoordinates[1]]
            : [currentCoordinates[0], val],
      });
    }
  };

  return (
    <Space className="flex items-center">
      <InputNumber
        min={min}
        max={max}
        id={name}
        placeholder={"X"}
        className="w-full"
        value={value?.coordinates[0] || null}
        disabled={disabled}
        onChange={(val) => handleChange(val, "X")}
        size={size}
        status={status}
        addonBefore="Long"
      />

      <InputNumber
        addonBefore="Lat"
        min={min}
        max={max}
        id={""}
        placeholder={"Y"}
        className="w-full"
        value={value?.coordinates[1] || null}
        disabled={disabled}
        onChange={(val) => handleChange(val, "Y")}
        size={size}
        status={status}
      />
    </Space>
  );
};

export default Coordinates;
