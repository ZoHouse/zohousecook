import { cn } from "@zo/utils/font";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  className,
  length = 6,
  disabled = false,
  autoFocus = false,
  onComplete,
}) => {
  const [otp, setOtp] = useState(value);
  const [error, setError] = useState("");
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = Array(length).fill(null);
  }, [length]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { value } = e.target;

    // Handle deletion (for mobile keyboards that don't trigger keyDown)
    if (value === "") {
      const newOtp = [...otp.split("")];
      newOtp[index] = "";
      const newOtpValue = newOtp.join("");
      setOtp(newOtpValue);
      onChange(newOtpValue);

      // Move to previous input if available
      if (index > 0) {
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    // Handle paste from Google keyboard (which pastes full text into single input)
    if (value.length > 1) {
      handlePaste(value);
      return;
    }

    // Only allow digits
    if (!/^\d+$/.test(value)) return;

    // Take only the last character if multiple were somehow entered
    const digit = value.slice(-1);

    // Update OTP state
    const newOtp = [...otp.split("")];
    newOtp[index] = digit;
    const newOtpValue = newOtp.join("");

    setOtp(newOtpValue);
    onChange(newOtpValue);

    // Move to next input if available
    if (index < length - 1) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    } else if (onComplete && newOtpValue.length === length) {
      onComplete(newOtpValue);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault();

      if (otp[index]) {
        // Clear current input
        const newOtp = [...otp.split("")];
        newOtp[index] = "";
        const newOtpValue = newOtp.join("");
        setOtp(newOtpValue);
        onChange(newOtpValue);
      } else if (index > 0) {
        // Move to previous input and clear it
        const newOtp = [...otp.split("")];
        newOtp[index - 1] = "";
        const newOtpValue = newOtp.join("");
        setOtp(newOtpValue);
        onChange(newOtpValue);
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Handle left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      setActiveInput(index - 1);
      inputRefs.current[index - 1]?.focus();
    }

    // Handle right arrow
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = useCallback(
    (text: string) => {
      const cleaned = text.replace(/\D/g, "").slice(0, length);
      setOtp(cleaned);
      onChange(cleaned);

      if (cleaned.length !== length) {
        setError(`OTP must be ${length} digits`);
      } else {
        setError("");
        if (onComplete) {
          onComplete(cleaned);
        }
      }

      // Focus the last filled input or the first empty one
      const focusIndex = Math.min(cleaned.length, length - 1);
      setActiveInput(focusIndex);
      inputRefs.current[focusIndex]?.focus();
    },
    [length, onChange, onComplete]
  );

  // Handle paste event on any input
  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    handlePaste(pastedData);
  };

  // Update inputs when OTP changes
  useEffect(() => {
    if (value !== otp) {
      setOtp(value);
    }
  }, [value]);

  // Focus active input
  useEffect(() => {
    if (!disabled) {
      inputRefs.current[activeInput]?.focus();
    }
  }, [activeInput, disabled]);

  // Handle initial focus
  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  // Handle OTP autofill from SMS
  useEffect(() => {
    // Create a hidden input for OTP autofill
    const hiddenInput = document.createElement("input");
    hiddenInput.setAttribute("type", "text");
    hiddenInput.setAttribute("inputmode", "numeric");
    hiddenInput.setAttribute("autocomplete", "one-time-code");
    hiddenInput.style.position = "absolute";
    hiddenInput.style.opacity = "0";
    hiddenInput.style.pointerEvents = "none";
    hiddenInput.style.zIndex = "-1";
    hiddenInput.style.width = "1px";
    hiddenInput.style.height = "1px";

    // Add event listener for input changes (autofill)
    hiddenInput.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        handlePaste(target.value);
      }
    });

    // Append to container
    if (containerRef.current) {
      containerRef.current.appendChild(hiddenInput);
    }

    // Clean up
    return () => {
      if (containerRef.current && containerRef.current.contains(hiddenInput)) {
        containerRef.current.removeChild(hiddenInput);
      }
    };
  }, [handlePaste]);

  return (
    <div
      className="flex flex-col items-center gap-4 mx-auto"
      ref={containerRef}
    >
      <div className="flex gap-2 items-center justify-center">
        {Array.from({ length }, (_, index) => {
          const digit = otp[index] || "";
          const isActive = index === activeInput;

          return (
            <div
              key={`otp-container-${index}`}
              className={cn(
                "w-10 h-10 relative",
                disabled && "opacity-50",
                className
              )}
            >
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={length}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handleInputPaste}
                onFocus={() => !disabled && setActiveInput(index)}
                disabled={disabled}
                className={cn(
                  "w-10 h-10 absolute inset-0 opacity-0 cursor-pointer z-10",
                  disabled && "cursor-not-allowed"
                )}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`OTP digit ${index + 1}`}
              />
              <div
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-md"
                )}
              >
                {digit ? (
                  <span className="mobile-title">{digit}</span>
                ) : isActive ? (
                  <div className="w-[3px] rounded-2xl h-8 bg-zostel-light-text-primary cursor-animation" />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="8"
                      fill="#111111"
                      fillOpacity="0.44"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-red-500 text-sm" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(OtpInput);
