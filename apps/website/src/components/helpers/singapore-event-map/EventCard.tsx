import { cn } from "@zo/utils/font";
import moment from "moment";
import React from "react";
import cultureMarkers from "../../../config/token2049";
import { rubikClassName } from "../../utils";

interface EventCardProps {
  name: string;
  startAt: string;
  startTime?: string;
  endTime?: string | null;
  price: string;
  location: string;
  distance: number;
  registerLink: string;
  subcategory?: string;
  navigationLink: string;
  isSelected: boolean;
  icon?: string;
  onSelect?: () => void;
  isInSearch?: boolean;
  itemType?: 'event' | 'activity';
  operatorName?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  name,
  startAt,
  startTime,
  endTime,
  onSelect,
  price,
  location,
  subcategory,
  distance,
  registerLink,
  navigationLink,
  isInSearch,
  icon,
  isSelected,
  itemType,
  operatorName,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col p-4 snap-center bg-zui-dark flex-shrink-0 rounded-xl border border-zui-white/10 w-[84vw] md:w-full md:snap-start",
        rubikClassName,
        isInSearch && "!w-full"
      )}
    >
      <button
        onClick={onSelect}
        className={cn(
          "transition-all text-left self-start ease-in-out duration-150",
          isSelected ? "text-zui-neon" : "text-zui-white",
          !isInSearch && onSelect != null ? "cursor-pointer" : "cursor-default"
        )}
      >
        {name}
      </button>
      <span className="flex items-center gap-2 text-sm mt-3 text-zui-silver">
        {itemType === 'activity' ? (
          <>
            <span>⚡</span>
            <span>{subcategory || 'Activity'}</span>
          </>
        ) : icon ? (
          <>
            <img src={icon} alt="icon" className="w-4 h-4" />
            <span>{subcategory}</span>
          </>
        ) : (
          <>
            <span>
              {subcategory ? cultureMarkers[subcategory.toLowerCase()] : "📍"}
            </span>
            <span>{subcategory}</span>
          </>
        )}
      </span>
      <div className="flex items-center gap-10 text-sm mt-2 text-zui-silver">
        <span className="flex items-center gap-2">
          <span>🕒</span>
          <span>
            {itemType === 'activity' && startTime
              ? `${moment(startAt).format("ddd, DD MMM")} • ${startTime}${endTime ? ` - ${endTime}` : ''}`
              : moment(startAt).format("ddd, DD MMM")}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span>💰</span>
          <span>{itemType === 'activity' && price === "0" ? "Free" : price}</span>
        </span>
      </div>
      <span className="text-sm mt-2 text-zui-silver flex items-start gap-2">
        <span>📍</span>
        <span>
          {location} • {distance} km
        </span>
      </span>
      <div className="flex items-center gap-3 mt-3">
        {!(itemType === 'activity' && price === "0") && (
          <a
            href={registerLink}
            target="_blank"
            className="px-3 py-2 bg-white text-black rounded-full text-xs font-semibold"
          >
            Register
          </a>
        )}
        <a
          href={navigationLink}
          target="_blank"
          className="px-3 py-2 border border-white/10 text-white rounded-full text-xs font-semibold"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
};

export default EventCard;
