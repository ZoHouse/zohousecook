import React, { useEffect, useRef, useState } from 'react';
import cn from '../../utils/cn';

/** SVG content cache — keyed by URL. */
const svgContentCache = new Map<string, string>();

/** Strip outer <svg> tags, keeping only inner content for layering. */
function stripSvg(raw: string): string {
  return raw.replace(/<\/?svg[^>]*>/g, '');
}

/** Fetch an SVG file and return its inner content (stripped of wrapper). */
async function fetchSvgContent(url: string): Promise<string> {
  if (svgContentCache.has(url)) return svgContentCache.get(url)!;
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const text = await res.text();
    const stripped = stripSvg(text);
    svgContentCache.set(url, stripped);
    return stripped;
  } catch {
    return '';
  }
}

export interface ZobuLayer {
  categoryId: number;
  order: number;
  assetId: number | null;
  svg: string | null;
}

export interface ZobuConfig {
  baseId: number;
  baseSvg: string;
  layers: ZobuLayer[];
}

interface AvatarDisplayProps {
  zobuConfig: ZobuConfig | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * Renders a full-body Zobu avatar using layered SVG composition.
 * Uses viewBox="154 0 200 512" to crop to the character body (matching old community app).
 */
export function AvatarDisplay({
  zobuConfig,
  size = 300,
  className,
  onClick,
}: AvatarDisplayProps) {
  if (!zobuConfig) {
    return (
      <div
        className={cn(
          'animate-pulse bg-white/5 rounded-dash-lg flex-shrink-0',
          onClick && 'cursor-pointer',
          className
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  // Sort layers by order, render base first then asset layers
  const sortedLayers = [...zobuConfig.layers].sort((a, b) => a.order - b.order);

  return (
    <div
      className={cn(
        'flex-shrink-0',
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      style={{ width: size }}
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="110 0 290 512"
        width="100%"
        fill="none"
      >
        {/* Base body layer */}
        <g
          id={`base-${zobuConfig.baseId}`}
          dangerouslySetInnerHTML={{ __html: zobuConfig.baseSvg }}
        />
        {/* Asset layers in order */}
        {sortedLayers.map((layer) =>
          layer.svg ? (
            <g
              key={layer.categoryId}
              id={`cat-${layer.categoryId}`}
              dangerouslySetInnerHTML={{ __html: layer.svg }}
            />
          ) : null
        )}
      </svg>
    </div>
  );
}

export { fetchSvgContent, stripSvg };
