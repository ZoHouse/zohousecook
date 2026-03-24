import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import React, { useEffect, useRef, useState } from "react";

interface JsonInputProp {
  label: string;
  value: GeneralObject;
  setValue: React.Dispatch<React.SetStateAction<GeneralObject>>;
  name: string;
  initialValue?: GeneralObject | string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const JsonInput: React.FC<JsonInputProp> = ({
  label,
  name,
  setValue,
  value,
  disabled,
  initialValue,
  placeholder,
  required,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([1]);

  const [inputValue, setInputValue] = useState<string>(
    JSON.stringify({
      key: "value",
    })
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const validateJson = (jsonString: string) => {
    try {
      const parsedValue = JSON.parse(jsonString);
      setValue(parsedValue);
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || "Invalid JSON format");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const _value = e.target.value;
    setInputValue(_value);
    validateJson(_value);
    updateLineNumbers(_value);
  };

  const updateLineNumbers = (text: string) => {
    if (text) {
      const lines = text.split("\n");
      const lineNumbersArray = Array.from(
        { length: lines.length },
        (_, i) => i + 1
      );
      setLineNumbers(lineNumbersArray);
    }
  };

  const syncScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (initialValue) {
      const initialString =
        typeof initialValue === "string"
          ? initialValue
          : JSON.stringify(initialValue, null, 2);
      setInputValue(initialString);
      updateLineNumbers(initialString);
    } else {
      const valueString = JSON.stringify(value, null, 2);
      setInputValue(valueString);
      updateLineNumbers(valueString);
    }
  }, [initialValue, value]);

  return (
    <div className="w-full border border-zui-light relative">
      <div className="relative flex border border-zui-lightest">
        <div
          ref={lineNumbersRef}
          className="line-numbers text-zui-silver text-right p-2 leading-relaxed select-none overflow-hidden flex-shrink-0 h-96 border-r border-zui-lightest"
        >
          {lineNumbers.map((lineNumber) => (
            <div key={lineNumber} className="text-sm h-6 leading-relaxed">
              {lineNumber}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onScroll={syncScroll}
          className="bg-zui-lighter w-full focus:outline-none text-sm resize-none leading-6 font-mono overflow-auto whitespace-nowrap"
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label}
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          aria-describedby={`${name}-error`}
          id={name}
        />
      </div>
      {error && (
        <p id={`${name}-error`} className="text-zui-red text-sm text-right">
          {error}
        </p>
      )}
    </div>
  );
};

export default JsonInput;
