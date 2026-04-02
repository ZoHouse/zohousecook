import React, { useState } from 'react';
import cn from '../../utils/cn';
import { AvatarCategory, AvatarAsset } from '../../hooks/useAvatarSeed';

interface TraitPickerProps {
  categories: AvatarCategory[];
  baseId: number;
  selectedAssets: Record<number, number | null>; // categoryId → assetId
  onBaseChange: (baseId: number) => void;
  onAssetSelect: (categoryId: number, assetId: number | null) => void;
}

/** Categories hidden from the picker UI */
const HIDDEN_CATEGORIES = new Set([1, 9]); // Base (1), Hand (9)

export function TraitPicker({
  categories,
  baseId,
  selectedAssets,
  onBaseChange,
  onAssetSelect,
}: TraitPickerProps) {
  const visibleCategories = categories
    .filter((c) => !HIDDEN_CATEGORIES.has(c.id))
    .sort((a, b) => (a.display_order ?? a.order) - (b.display_order ?? b.order));

  const [activeCatId, setActiveCatId] = useState(visibleCategories[0]?.id ?? 0);
  const activeCategory = categories.find((c) => c.id === activeCatId);

  // Filter assets available for the current base
  const availableAssets = activeCategory?.assets.filter(
    (a) => !a.bases || a.bases.length === 0 || a.bases.includes(baseId)
  ) ?? [];

  const selectedAssetId = selectedAssets[activeCatId] ?? null;

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Base toggle (Bro / Bae) */}
      <div className="flex gap-3 flex-shrink-0">
        {[
          { id: 1, label: 'Bro' },
          { id: 2, label: 'Bae' },
        ].map((b) => (
          <button
            key={b.id}
            onClick={() => onBaseChange(b.id)}
            className={cn(
              'flex-1 py-2 rounded-dash-sm text-sm font-medium uppercase tracking-wider transition-colors',
              baseId === b.id
                ? 'bg-white/20 text-dash-text border border-white/30'
                : 'bg-white/5 text-dash-text-50 hover:bg-white/10 border border-transparent'
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0 pb-1">
        {visibleCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCatId(cat.id)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-dash-pill text-xs font-medium transition-colors',
              activeCatId === cat.id
                ? 'bg-white/20 text-dash-text border border-white/30'
                : 'bg-white/5 text-dash-text-50 hover:bg-white/10 border border-transparent'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Asset grid — 4 columns */}
      <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1 pt-1">
        {/* None option */}
        <button
          onClick={() => onAssetSelect(activeCatId, null)}
          className={cn(
            'h-20 rounded-dash-sm border flex items-center justify-center text-[11px] font-medium transition-colors',
            selectedAssetId === null
              ? 'border-white/40 bg-white/15 text-dash-text'
              : 'border-dash-border bg-white/5 text-dash-text-50 hover:border-dash-border-hover'
          )}
        >
          None
        </button>

        {/* Asset thumbnails */}
        {availableAssets.map((asset) => {
          const isSelected = selectedAssetId === asset.id;
          return (
            <button
              key={asset.id}
              onClick={() => onAssetSelect(activeCatId, asset.id)}
              title={asset.name}
              className={cn(
                'h-20 rounded-dash-sm border overflow-hidden transition-colors flex-shrink-0',
                isSelected
                  ? 'border-white/40 bg-white/15'
                  : 'border-dash-border bg-white/5 hover:border-dash-border-hover'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.cropped_file || asset.file}
                alt={asset.name}
                className="w-full h-full object-contain p-2"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
