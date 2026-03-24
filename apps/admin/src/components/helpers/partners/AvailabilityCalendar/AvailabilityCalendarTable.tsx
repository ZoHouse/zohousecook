import {
  RatePlan,
  SelectionsInventory,
  SelectionsInventoryPricing,
} from "apps/admin/src/config";
import { format } from "date-fns";
import React, { useCallback, useMemo, useState } from "react";
import PricingDetailsModal from "./PricingDetailsModal";
import { RatePlanRow, RoomHeaderRow } from "./TableRows";

export interface SelectedCell {
  roomId: string;
  ratePlanId: string;
  date: string;
}

export interface AvailabilityCalendarTableProps {
  inventories: SelectionsInventory[];
  dates: Date[];
}

const AvailabilityCalendarTable: React.FC<AvailabilityCalendarTableProps> = ({
  inventories,
  dates,
}) => {
  const getRatePlansForRoom = (room: SelectionsInventory): RatePlan[] => {
    const ratePlanMap = new Map<string, RatePlan>();

    if (Array.isArray(room.rate_plans)) {
      room.rate_plans.forEach((rp: RatePlan) =>
        ratePlanMap.set(rp.id, {
          ...rp,
          label_public: rp.label_public || rp.label_private || "Rate Plan",
        })
      );
    } else if (room.pricing?.length) {
      room.pricing.forEach((p: SelectionsInventoryPricing) => {
        if (!ratePlanMap.has(p.rate_plan)) {
          ratePlanMap.set(p.rate_plan, {
            id: p.rate_plan,
            label_public: `Rate Plan - ${p.adult_occupancy} Adult(s)`,
            status: "active",
            pid: "",
          });
        }
      });
    }

    return Array.from(ratePlanMap.values());
  };

  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(
    new Set(inventories.map((room) => room.id))
  );
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleRoom = useCallback((roomId: string) => {
    setExpandedRooms((prev) => {
      const updated = new Set(prev);
      updated.has(roomId) ? updated.delete(roomId) : updated.add(roomId);
      return updated;
    });
  }, []);

  const getRoomById = useCallback(
    (roomId: string): SelectionsInventory | undefined =>
      inventories.find((r) => r.id === roomId),
    [inventories]
  );

  const handleCellClick = useCallback(
    (roomId: string, ratePlanId: string, date: string) => {
      setSelectedCell({ roomId, ratePlanId, date });
      setIsModalVisible(true);
    },
    []
  );

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const ratePlansMap = useMemo(
    () =>
      new Map(inventories.map((room) => [room.id, getRatePlansForRoom(room)])),
    [inventories]
  );

  return (
    <>
      <div
        className={`overflow-x-auto text-xs`}
        style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}
      >
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 w-48 px-4 py-4 text-left text-sm font-bold bg-gradient-to-r from-zui-dark to-zui-lighter border-r border-zui-lightest">
                <span className="text-zui-neon">Room / Rate Plan</span>
              </th>

              {dates.map((date) => {
                const key = date.toISOString();
                return (
                  <th
                    key={key}
                    className="px-3 py-4 text-center text-xs font-bold bg-zui-lighter border-l border-zui-lightest min-w-[140px] hover:bg-zui-light transition-colors"
                  >
                    <div className="font-bold text-zui-neon">
                      {format(date, "MMM d")}
                    </div>
                    <div className="text-zui-silver text-xs mt-1">
                      {format(date, "EEE")}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-gradient-to-br from-zui-dark via-zui-light to-zui-dark">
            {inventories.map((room: SelectionsInventory) => {
              const ratePlans = ratePlansMap.get(room.id) || [];
              const isRoomExpanded = expandedRooms.has(room.id);

              return (
                <React.Fragment key={room.id}>
                  {/* Room Header Row */}
                  <RoomHeaderRow
                    room={room}
                    isExpanded={isRoomExpanded}
                    onToggle={toggleRoom}
                    dates={dates}
                  />

                  {/* Rate Plan Rows */}
                  {isRoomExpanded &&
                    ratePlans.map((ratePlan) => (
                      <RatePlanRow
                        key={`${room.id}-${ratePlan.id}`}
                        room={room}
                        ratePlanId={ratePlan.id}
                        ratePlanLabel={ratePlan.label_public || "Rate Plan"}
                        dates={dates}
                        onCellClick={handleCellClick}
                      />
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pricing Details Modal */}
      <PricingDetailsModal
        isVisible={isModalVisible}
        onClose={closeModal}
        selectedCell={selectedCell}
        getRoomById={getRoomById}
      />
    </>
  );
};

export default AvailabilityCalendarTable;
