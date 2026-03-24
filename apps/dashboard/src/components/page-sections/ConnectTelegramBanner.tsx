import React from "react";
import { Button } from "../common";

interface FounderBarProps {
  isTelegramConnected: boolean;
}

const ConnectTelegramBanner: React.FC<FounderBarProps> = ({
  isTelegramConnected,
}) => {
  const connectTelegram = () => {
    const url = "https://t.me/ZoGatekeeperBot?start=";

    window.open(url, "_blank");
  };

  return (
    !isTelegramConnected && (
      <div className="flex flex-col md:flex-row md:items-center p-4 mb-4 bg-[#2c92f1] text-white border border-zui-black justify-between">
        <div className="flex items-center">
          <i className="uil uil-telegram text-2xl ml-2 md:text-6xl text-white" />
          <h2 className="ml-4 font-bold text-xl text-white md:text-2xl">
            Connect Your Telegram Account
          </h2>
        </div>
        <Button
          fixedsize
          icon="arrow-right"
          className="bg-black mt-4 md:mt-0"
          onClick={connectTelegram}
        >
          Connect
        </Button>
      </div>
    )
  );
};

export default ConnectTelegramBanner;
