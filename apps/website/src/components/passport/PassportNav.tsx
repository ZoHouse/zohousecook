import React from "react";
import { useRouter } from "next/router";
import useInstagramConnect from "../../hooks/useInstagramConnect";

const PassportNav: React.FC = () => {
  const router = useRouter();
  const { isConnected, account, connect } = useInstagramConnect();

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

      {/* Right: Instagram status pill */}
      <button
        onClick={!isConnected ? connect : undefined}
        className={`rounded-full flex items-center gap-1.5 px-3 py-1 ${
          isConnected ? "bg-green-700" : "bg-orange-500"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full ${
            isConnected ? "bg-green-400" : "bg-[#FFD600]"
          }`}
        />
        <span
          className="font-medium"
          style={{
            fontSize: 16,
            color: isConnected ? "#4ade80" : "#FFD600",
          }}
        >
          {isConnected && account
            ? `@${account.username}`
            : "Not Connected"}
        </span>
        <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
              fill="#111"
            />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default PassportNav;
