import React from "react";

interface StatisticProps {
  label: string;
  value: number;
}

const Statistic: React.FC<StatisticProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col w-32 md:w-56 gap-1">
      <span className="text-sm font-light">{label}</span>
      <span className="text-2xl font-medium">
        {value?.toLocaleString("en")}
      </span>
    </div>
  );
};

export default Statistic;
