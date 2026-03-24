import React, { useEffect, useRef } from "react";

interface TextAreaPolicyProps {
  value: string;
  policyId: number;
  isActive: boolean;
  onTextChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    policyId: number
  ) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    policyId: number
  ) => void;
}

const TextAreaPolicy: React.FC<TextAreaPolicyProps> = ({
  value,
  policyId,
  isActive,
  onTextChange,
  onKeyDown,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current && isActive) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isActive]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e, policyId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown(e, policyId);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleTextChange}
      onKeyDown={handleKeyDown}
      className="w-full font-medium text-base caret-zui-neon outline-none focus:outline-none zui-form-element resize-none rounded text-white bg-transparent break-words"
      autoFocus
    />
  );
};

export default TextAreaPolicy;
