import React from "react";

interface StepProgressProps {
  steps: number;
  step: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, step }) => {
  const screenProgress = [];
  for (let i = 1; i <= steps; i++) {
    screenProgress.push(
      <div
        key={i}
        className={`${
          step >= i ? "bg-zui-white" : "bg-zui-light"
        } h-1 flex-grow`}
      />
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full flex items-center justify-between space-x-1">
      {screenProgress}
    </div>
  );
};

export default StepProgress;
