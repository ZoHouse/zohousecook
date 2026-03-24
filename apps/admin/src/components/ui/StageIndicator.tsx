import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize } from "@zo/utils/string";
import { Flex, Tooltip, Typography } from "antd";
import React, { useMemo } from "react";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
interface StageIndicatorProps {
  stages: Array<{ label: string; value: string }>;
  currentStage: string;
  className?: string;
}

const StageIndicator: React.FC<StageIndicatorProps> = ({
  currentStage,
  stages,
  className,
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
    <Flex align="center" className={className} gap={16}>
      <span className="flex gap-2 items-center">
        {stages.map((stage) => (
          <Tooltip title={stage.label}>
            <div
              key={stage.value}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                stage.value < activeStage?.value
                  ? "bg-zui-green"
                  : "bg-zui-silver",
                stage.value === activeStage?.value && "bg-zui-yellow "
              )}
            >
              {stage.value < activeStage?.value && (
                <DoneOutlinedIcon sx={{ fontSize: 14 }} />
              )}
              {stage.value === activeStage?.value && (
                <PendingOutlinedIcon sx={{ fontSize: 14 }} />
              )}
              {stage.value > activeStage?.value && (
                <LockOutlinedIcon sx={{ fontSize: 14 }} />
              )}
            </div>
          </Tooltip>
        ))}
      </span>
      <Typography.Text style={{ margin: 0 }}>
        {formatCapitalize(currentStage).replace("-", " ")}
      </Typography.Text>
    </Flex>
  );
};

export default StageIndicator;
