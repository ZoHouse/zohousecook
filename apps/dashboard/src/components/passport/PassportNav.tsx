import React from "react";
import { useRouter } from "next/router";

const PassportNav: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex flex-row items-center justify-between px-6 py-4 w-full">
      {/* Left: Tabs */}
      <div className="flex flex-row items-center gap-6">
        <button
          className="text-white font-medium"
          style={{ fontSize: 20 }}
        >
          Quests
        </button>
        <button
          className="text-white opacity-40"
          style={{ fontSize: 20 }}
          onClick={() => router.push("/")}
        >
          Dashboard
        </button>
      </div>
    </div>
  );
};

export default PassportNav;
