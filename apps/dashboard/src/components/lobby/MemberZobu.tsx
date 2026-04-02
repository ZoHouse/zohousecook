import React, { useEffect, useState } from 'react';
import { fetchSvgContent } from './AvatarDisplay';

interface MemberZobuProps {
  avatarUrl: string;
  nickname: string;
  size?: number;
  speaking?: boolean;
}

export function MemberZobu({ avatarUrl, nickname, size = 140, speaking = false }: MemberZobuProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (avatarUrl) {
      fetchSvgContent(avatarUrl).then(setSvg).catch(() => setSvg(null));
    }
  }, [avatarUrl]);

  return (
    <div className={`flex flex-col items-center gap-1 pointer-events-auto transition-all ${speaking ? 'drop-shadow-[0_0_12px_rgba(241,88,36,0.5)]' : ''}`}>
      <div style={{ width: size, height: size * 1.8 }}>
        {svg ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="110 0 290 512"
            width="100%"
            height="100%"
            fill="none"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="w-full h-full rounded-dash-md bg-white/5 animate-pulse" />
        )}
      </div>
      <span className="px-2 py-0.5 text-[10px] text-dash-text-80 bg-black/40 backdrop-blur-sm rounded-dash-pill">
        {nickname}
      </span>
    </div>
  );
}
