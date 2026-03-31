import React, { useEffect, useRef, useState } from 'react';
import { AvatarConfig, renderAvatar } from '@zo/avatar-renderer';
import cn from '../../utils/cn';

// Simple hash of an AvatarConfig to use as cache key
function configHash(config: AvatarConfig): string {
  return `${config.bodyType}:${JSON.stringify(config.traits)}`;
}

const svgCache = new Map<string, string>();

interface AvatarDisplayProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function AvatarDisplay({
  config,
  size = 300,
  className,
  onClick,
}: AvatarDisplayProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const key = configHash(config);
    if (svgCache.has(key)) {
      setSvg(svgCache.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    renderAvatar(config, '/avatar').then((result) => {
      if (!mountedRef.current) return;
      svgCache.set(key, result);
      setSvg(result);
      setLoading(false);
    });
  }, [config]);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
  };

  if (loading) {
    return (
      <div
        className={cn(
          'animate-pulse bg-white/5 rounded-dash-lg flex-shrink-0',
          onClick && 'cursor-pointer',
          className
        )}
        style={containerStyle}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex-shrink-0 overflow-hidden',
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      style={containerStyle}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: svg ?? '' }}
    />
  );
}
