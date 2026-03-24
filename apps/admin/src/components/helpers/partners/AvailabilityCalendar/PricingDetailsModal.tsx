import Icon from "@zo/assets/icons";
import { Modal } from "antd";
import { SelectionsInventory } from "apps/admin/src/config";
import React from "react";
import { SelectedCell } from "./AvailabilityCalendarTable";
import {
  BookingRulesSection,
  OccupancySection,
  PricingInfoSection,
  RatePlanInfoSection,
  RoomInfoSection,
} from "./ModalSections";
import { getPricingForRatePlan } from "./utils";

export interface PricingDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedCell: SelectedCell | null;
  getRoomById: (roomId: string) => SelectionsInventory | undefined;
}

export const PricingDetailsModal: React.FC<PricingDetailsModalProps> = ({
  isVisible,
  onClose,
  selectedCell,
  getRoomById,
}) => {
  if (!selectedCell || !getRoomById(selectedCell.roomId)) {
    return null;
  }

  const room = getRoomById(selectedCell.roomId);
  const pricing = room
    ? getPricingForRatePlan(room, selectedCell.ratePlanId, selectedCell.date)
    : null;

  return (
    <Modal
      title={
        room ? (
          <div className="flex items-center gap-2">
            <Icon name="Info" className="w-5 h-5 text-zui-neon" />
            <span>Pricing Details</span>
          </div>
        ) : (
          "Details"
        )
      }
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="space-y-4">
        {/* Room Information */}
        {room && <RoomInfoSection room={room} />}

        {/* Rate Plan Information */}
        {room && (
          <RatePlanInfoSection
            room={room}
            ratePlanId={selectedCell.ratePlanId}
          />
        )}

        {/* Pricing Information */}
        <PricingInfoSection
          selectedDate={selectedCell.date}
          pricing={pricing}
          currency={room?.currency}
        />

        {/* Booking Rules */}
        <BookingRulesSection pricing={pricing} />

        {/* Occupancy Information */}
        <OccupancySection pricing={pricing} />
      </div>
    </Modal>
  );
};

export default PricingDetailsModal;
