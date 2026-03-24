import React from "react";

interface ProgressProps {
  total: number;
  current: number;
}

const Progress: React.FC<ProgressProps> = ({ total, current }) => {
  return (
    <div className="w-32 h-[6px] relative rounded-xl overflow-hidden">
      <div className="w-full h-full bg-cherry-background-input absolute top-0 left-0"></div>
      <div
        className="h-full transition-all ease-in-out duration-500 bg-cherry-background-green relative"
        style={{ width: `${(current / total) * 100}%` }}
      ></div>
    </div>
  );
};

export default Progress;
