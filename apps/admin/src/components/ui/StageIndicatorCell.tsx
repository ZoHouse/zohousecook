import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize } from "@zo/utils/string";
import React, { useMemo } from "react";

interface StageIndicatorCellProps {
  stages: Array<{ label: string; value: string }>;
  currentStage: string;
}

const StageIndicatorCell: React.FC<StageIndicatorCellProps> = ({
  currentStage,
  stages,
}) => {
  const activeStage = useMemo(() => {
    const active = stages?.find((stage) => stage.label === currentStage);
    if (isValidObject(active) && active) {
      return active;
    } else {
      return { value: 0, label: "" };
    }
  }, [currentStage, stages]);

  return (
    <div>
      <h4 className="mb-1">
        {formatCapitalize(currentStage).replace("-", " ")}
      </h4>
      <span className="flex gap-1 items-center">
        {stages.map((stage) => (
          <div
            key={stage.value}
            className={cn(
              "w-[6px] h-[6px] rounded-full",
              stage.value < activeStage?.value
                ? "bg-zui-green"
                : "bg-zui-silver"
            )}
          />
        ))}
      </span>
    </div>
  );
};

export default StageIndicatorCell;
