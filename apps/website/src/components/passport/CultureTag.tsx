import React, { useState } from "react";
import { rubikClassName } from "../utils/font";

interface CultureTagProps {
  name: string;
  icon?: string;
}

function fixCdnUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

const CultureTag: React.FC<CultureTagProps> = ({ name, icon }) => {
  const [imgError, setImgError] = useState(false);
  const src = fixCdnUrl(icon);

  return (
    <div
      className={`flex items-center gap-1.5 bg-[#202020] px-2.5 py-1.5 rounded-2xl ${rubikClassName}`}
    >
      {src && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-5 h-5 object-contain flex-shrink-0"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-sm flex-shrink-0">🏛️</span>
      )}
      <span className="text-white text-[12px] tracking-wider whitespace-nowrap">{name}</span>
    </div>
  );
};

export default CultureTag;
