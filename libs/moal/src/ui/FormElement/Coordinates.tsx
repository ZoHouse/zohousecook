/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@zo/utils/font";
import React, { useEffect, useState } from "react";

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
}) => {
  const [coordinates, setCoordinates] = useState<Coordinates>({
    type: "Point",
    coordinates: [0.0, 0.0],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    coordinateType: "X" | "Y"
  ) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setCoordinates((prevCoordinates: Coordinates) => {
        const newCoordinates = { ...prevCoordinates };
        if (coordinateType === "X") {
          newCoordinates.coordinates[0] = value;
        } else {
          newCoordinates.coordinates[1] = value;
        }
        return newCoordinates;
      });
    }
  };

  useEffect(() => {
    if (coordinates) {
      setValue(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue);
    }
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col bg-zui-light justify-center w-full px-6 py-4",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <label className={cn("text-xs text-zui-white")} htmlFor={name}>
        {label} {required && <span className="text-zui-silver">*</span>}
      </label>
      <div className="flex items-center">
        <div>
          <span className="text-xs text-zui-silver">Longitude</span>
          <input
            min={min}
            max={max}
            id={name}
            type={"number"}
            placeholder={"X"}
            autoComplete="off"
            className={cn(
              "w-full relative  zui-form-element placeholder:text-zui-silver font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent"
            )}
            value={value?.coordinates[0] || null}
            disabled={disabled}
            onChange={(e) => handleChange(e, "X")}
          />
        </div>

        <div>
          <span className="text-xs text-zui-silver">Latitude</span>
          <input
            min={min}
            max={max}
            id={""}
            type={"number"}
            placeholder={"Y"}
            autoComplete="off"
            className={cn(
              "w-full relative  zui-form-element placeholder:text-zui-silver font-light text-base caret-zui-neon outline-none focus:outline-none bg-transparent"
            )}
            value={value?.coordinates[1] || null}
            disabled={disabled}
            onChange={(e) => handleChange(e, "Y")}
          />
        </div>
      </div>
    </div>
  );
};

export default Coordinates;
