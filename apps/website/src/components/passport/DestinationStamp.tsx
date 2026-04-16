import React, { useState } from "react";
import { stampUrlFor } from "../../lib/passport/stampUrl";

interface DestinationStampProps {
  name: string;
  imageUrl?: string | null;
}

const DestinationStamp: React.FC<DestinationStampProps> = ({ name, imageUrl }) => {
  const initialUrl = imageUrl || stampUrlFor(name);
  const [failed, setFailed] = useState(false);

  if (!initialUrl || failed) {
    return (
      <div className="aspect-square rounded-xl bg-white/5 flex items-center justify-center p-2 text-center">
        <span className="text-[10px] text-white/80">{name}</span>
      </div>
    );
  }

  return (
    <div className="aspect-square rounded-xl bg-white/5 flex items-center justify-center p-2 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={initialUrl}
        alt={name}
        title={name}
        className="w-full h-full object-contain"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default DestinationStamp;
