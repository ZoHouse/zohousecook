import React from "react";
import { cn } from "../utils";

interface PlayButtonIconProps {
  onClick?: () => void;
  className?: string;
  isPlaying: boolean;
}

const PlayButtonIcon: React.FC<PlayButtonIconProps> = ({
  onClick,
  className,
  isPlaying,
}) => {
  return (
    <div className={cn("flex gap-2 font-bold items-center  px-3 py-2 rounded-full opacity-80", className)}>
      {isPlaying ? (
        <svg
          width="24"
          height="18"
          viewBox="0 0 24 18"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.82967 5.72505C5.25768 5.82905 3.8917 5.73989 3.31257 5.72504C2.13587 5.69487 1.85787 5.48059 1.06351 5.71788C0.906298 5.67296 1.09046 12.2753 1.09046 12.6877C2.94396 12.6877 3.63388 12.6298 6.22685 12.6298M5.82967 5.72505C7.35994 5.44682 9.35165 0.173704 10.993 1.11162C16.4852 4.25003 13.5576 18.1108 11.489 16.9287C10.2611 16.2271 7.35572 12.6298 6.22685 12.6298M5.82967 5.72505L6.22685 12.6298"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M20.1847 3.65033C20.4953 4.11035 20.7756 4.56233 21.0124 5.06287C21.5906 6.28547 21.9394 7.47174 22.1204 8.80855C22.2984 10.123 22.1173 11.6983 21.7299 12.9577C21.5673 13.4863 21.3223 13.9192 21.0821 14.4103"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            d="M17.3081 6.94839C17.4293 7.12795 17.5388 7.30437 17.6312 7.49974C17.8569 7.97694 17.993 8.43997 18.0637 8.96175C18.1331 9.4748 18.0625 10.0897 17.9112 10.5812C17.8478 10.7876 17.7521 10.9565 17.6584 11.1482"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      ) : (
        <svg
          width="25"
          height="18"
          viewBox="0 0 25 18"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.82967 5.72505C5.25768 5.82905 3.8917 5.73989 3.31257 5.72504C2.13587 5.69487 1.85787 5.48059 1.06351 5.71788C0.906298 5.67296 1.09046 12.2753 1.09046 12.6877C2.94396 12.6877 3.63388 12.6298 6.22685 12.6298M5.82967 5.72505C7.35994 5.44682 9.35165 0.173704 10.993 1.11162C16.4852 4.25003 13.5576 18.1108 11.489 16.9287C10.2611 16.2271 7.35572 12.6298 6.22685 12.6298M5.82967 5.72505L6.22685 12.6298"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M23.2267 5.64038C22 6.5 21.6966 6.82689 21.2245 7.26828C20.1776 8.24687 19.1198 9.21496 18.1285 10.2507C17.9512 10.4359 16.3705 11.9928 16.3365 11.9248"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            d="M17.0938 4.88322C17.0938 4.82596 17.1727 5.06315 17.1863 5.08513C17.4583 5.52336 17.8062 5.92727 18.1159 6.33866C19.2499 7.84477 20.4077 9.336 21.6241 10.7765C22.1183 11.3617 22.6252 11.9735 23.0753 12.5895C23.1175 12.6472 23.3782 12.9225 23.3782 12.8334"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      )}

      {/* <span className="text-black">{isPlaying ? "Sound ON" : "Sound OFF"}</span> */}
    </div>
  );
};

export default PlayButtonIcon;
