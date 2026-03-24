import React from "react";

interface StatItemProps {
  label: string;
  value: string | number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <div className="flex flex-col space-y-1">
    <span className="text-sm font-light">{label}</span>
    <span className="text-2xl font-medium">{value?.toLocaleString("en")}</span>
  </div>
);

interface FoundersProps {}

const Founders: React.FC<FoundersProps> = () => {
  const stats = [
    { label: "App installed", value: 240 },
    { label: "Telegram handles", value: 240 },
    { label: "X handles", value: 240 },
    { label: "Name", value: 240 },
    { label: "Phone number", value: 240 },
    { label: "Email", value: 240 },
  ];

  return (
    <div className="h-full w-full sm:w-[768px] border border-zui-light p-4 mt-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl text-zui-neon">Founders</h2>
      </div>
      <div className="flex items-center mt-8">
        <span className="text-6xl mb-2">434</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8  w-full sm:w-[620px] mt-12">
        {stats.map((stat, index) => (
          <StatItem key={index} label={stat.label} value={stat.value} />
        ))}
      </div>
    </div>
  );
};

export default Founders;
