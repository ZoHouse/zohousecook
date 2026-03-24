import React, { useState } from "react";
import { cn } from "@zo/utils/font";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "@zo/utils/hooks";

interface TimeSelectorProps {
  onSubmit: (time: string) => void;
  value: string;
}

const times = [
  "12:00 AM",
  "1:00 AM",
  "2:00 AM",
  "3:00 AM",
  "4:00 AM",
  "5:00 AM",
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
];

const TimeSelector: React.FC<TimeSelectorProps> = ({ onSubmit, value }) => {
  const [selectedTime, setSelectedTime] = useState<string>(value || times[0]);
  const [isOpen, setIsOpen] = useState(false);

  const selectorRef = React.useRef<HTMLDivElement>(null);

  useOutsideClick(selectorRef, () => setIsOpen(false));

  return (
    <div className="relative w-28" ref={selectorRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 text-left rounded-full bg-zostel-light-background-secondary flex items-center justify-between font-semibold text-sm"
        )}
      >
        <span>{selectedTime}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-0 bg-zostel-light-background-secondary rounded-lg shadow-lg overflow-hidden text-sm"
          >
            <div className="max-h-60 overflow-auto scrollbar">
              <div className="py-1">
                {times.map((time) => (
                  <button
                    key={time}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      selectedTime === time ? "bg-gray-50" : ""
                    }`}
                    onClick={() => {
                      setSelectedTime(time);
                      onSubmit(time);
                      setIsOpen(false);
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimeSelector;
