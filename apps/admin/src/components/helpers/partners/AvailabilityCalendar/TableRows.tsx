import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Tooltip } from "antd";
import {
  SelectionsInventory,
  SelectionsInventoryPricing,
} from "apps/admin/src/config";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";
import dayjs from "dayjs";
import Icon from "libs/assets/icons/src/Icon";
import React from "react";
import { getPricingForRatePlan } from "./utils";

interface RoomHeaderRowProps {
  room: SelectionsInventory;
  isExpanded: boolean;
  onToggle: (roomId: string) => void;
  dates: Date[];
}

export interface DisplayPricing extends SelectionsInventoryPricing {
  displayPrice: string;
  currencySymbol: string;
  currencyCode: string;
}

export const RoomHeaderRow: React.FC<RoomHeaderRowProps> = ({
  room,
  isExpanded,
  onToggle,
  dates,
}) => (
  <tr
    className={`border-t border-zui-lightest hover:bg-zui-lighter/50 transition-colors`}
  >
    <td
      className="sticky left-0 z-10 px-4 py-3 bg-zui-light cursor-pointer hover:bg-zui-lighter transition-colors border-r border-zui-lightest"
      onClick={() => onToggle(room.id)}
    >
      <div className="flex items-center gap-3">
        <Icon
          name="AngleRight"
          className={`w-4 h-4 text-zui-neon transform transition-transform duration-300 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zui-neon truncate">
            {room.name}
          </div>
          <div className="text-xs text-zui-silver mt-1 capitalize">
            {room.category} • {room.units} total units
          </div>
        </div>
      </div>
    </td>

    {dates.map((date) => {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const availability = room.availability?.find((a) => a.date === dateStr);
      const isRoomActive = room.availability && room.availability.length > 0;

      return (
        <td
          key={dateStr}
          className="px-3 py-3 text-center bg-zui-darker border-l border-zui-lightest min-w-[140px] hover:bg-zui-light transition-colors"
        >
          <div>
            <div className="text-sm font-medium text-zui-white">
              {availability?.units || "0"}
            </div>
            <div
              className={`mt-1 text-xxs font-medium uppercase ${
                isRoomActive ? "text-zui-green" : "text-zui-red"
              }`}
            >
              <span className="pr-1">
                {availability ? "Available" : "Unavailable"}
              </span>

              {availability ? (
                <CheckIcon sx={{ fontSize: 14 }} />
              ) : (
                <CloseIcon sx={{ fontSize: 14 }} />
              )}
            </div>
          </div>
        </td>
      );
    })}
  </tr>
);

interface RatePlanRowProps {
  room: SelectionsInventory;
  ratePlanId: string;
  ratePlanLabel: string;
  dates: Date[];
  onCellClick: (roomId: string, ratePlanId: string, date: string) => void;
}

/**
 * Rate plan row component
 */
export const RatePlanRow: React.FC<RatePlanRowProps> = ({
  room,
  ratePlanId,
  ratePlanLabel,
  dates,
  onCellClick,
}) => (
  <tr className="border-b border-zui-lightest hover:bg-zui-lighter/30 transition-colors">
    <td className="sticky left-0 z-10 px-4 py-3 text-xs font-medium text-zui-neon bg-zui-light border-r border-zui-lightest pl-12">
      <span className="text-zui-white whitespace-nowrap">{ratePlanLabel}</span>
    </td>

    {dates.map((date) => {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      const pricing = getPricingForRatePlan(room, ratePlanId, dateStr);

      return (
        <td
          key={dateStr}
          className="px-3 py-3 text-center border border-zui-lightest min-w-[140px] bg-zui-darker hover:bg-zui-light cursor-pointer transition-colors group"
          onClick={() => onCellClick(room.id, ratePlanId, dateStr)}
        >
          {pricing ? (
            <Tooltip
              title={`Click for details: ${formatCurrencyPrice(
                pricing.price,
                room.currency
              )}`}
            >
              <div className="text-xs">
                <div className="font-medium text-xs text-zui-neon group-hover:text-zui-yellow transition-colors flex items-center justify-center gap-1">
                  {formatCurrencyPrice(pricing.price, room.currency)}
                </div>

                <div
                  className={`mt-1 text-xxs font-medium uppercase ${
                    pricing.sellable ? "text-zui-green" : "text-zui-red"
                  }`}
                >
                  <span className="pr-1">
                    {pricing.sellable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </Tooltip>
          ) : (
            <div className="text-zui-silver text-xs">
              <div>No Data</div>
            </div>
          )}
        </td>
      );
    })}
  </tr>
);
