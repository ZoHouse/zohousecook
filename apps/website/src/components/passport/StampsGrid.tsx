import React from "react";
import DestinationStamp from "./DestinationStamp";

interface StampItem {
  name: string;
  imageUrl?: string | null;
}

interface StampsGridProps {
  stamps: StampItem[];
  heading?: string;
}

const StampsGrid: React.FC<StampsGridProps> = ({ stamps, heading = "Destination Stamps" }) => {
  if (!stamps.length) return null;

  return (
    <div>
      <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
        {heading}
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {stamps.map((stamp, i) => (
          <DestinationStamp
            key={`${stamp.name}-${i}`}
            name={stamp.name}
            imageUrl={stamp.imageUrl}
          />
        ))}
      </div>
    </div>
  );
};

export default StampsGrid;
