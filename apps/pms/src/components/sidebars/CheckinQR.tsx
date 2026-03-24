import { QRCode, SidebarMini } from "@zo/moal";
import React from "react";

interface CheckinQRSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookingCode?: string;
  operatorCode: string;
}

const CheckinQRSidebar: React.FC<CheckinQRSidebarProps> = ({
  isOpen,
  onClose,
  bookingCode = "",
  operatorCode,
}) => {
  return (
    <SidebarMini
      headerOptions={{
        title: "Scan QR to check-in",
        hasCloseButton: true,
      }}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="mt-10">
        <QRCode
          link={`https://www.zostel.com/checkin/${operatorCode}/${bookingCode}`}
          className="w-[336px] h-[336px] bg-white p-4"
          backgroundColor="#FFF"
          rounded={false}
        />
      </div>
    </SidebarMini>
  );
};

export default CheckinQRSidebar;
