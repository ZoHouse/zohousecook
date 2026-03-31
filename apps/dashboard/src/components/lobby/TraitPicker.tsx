import React, { useRef } from 'react';
import {
  AvatarConfig,
  BodyType,
  BROS_LAYER_ORDER,
  BAES_LAYER_ORDER,
  Trait,
  getTraits,
} from '@zo/avatar-renderer';
import cn from '../../utils/cn';

const HIDDEN_CATEGORIES = new Set(['skin']);

interface TraitPickerProps {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

export function TraitPicker({ config, onChange }: TraitPickerProps) {
  const layerOrder =
    config.bodyType === 'bros' ? BROS_LAYER_ORDER : BAES_LAYER_ORDER;
  const visibleCategories = layerOrder.filter((c) => !HIDDEN_CATEGORIES.has(c));

  const [activeCategory, setActiveCategoryState] = React.useState<string>(
    visibleCategories[0] ?? ''
  );

  // Reset active category when body type changes
  const prevBodyType = useRef(config.bodyType);
  if (prevBodyType.current !== config.bodyType) {
    prevBodyType.current = config.bodyType;
    // eslint-disable-next-line react-hooks/rules-of-hooks
  }

  const handleBodyTypeChange = (bodyType: BodyType) => {
    if (bodyType === config.bodyType) return;
    const newLayerOrder =
      bodyType === 'bros' ? BROS_LAYER_ORDER : BAES_LAYER_ORDER;
    const newVisible = newLayerOrder.filter((c) => !HIDDEN_CATEGORIES.has(c));
    setActiveCategoryState(newVisible[0] ?? '');
    // Caller (AvatarEditor) handles resetting to random on body type change
    onChange({ ...config, bodyType });
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategoryState(category);
  };

  const handleTraitSelect = (category: string, traitId: number) => {
    const newTraits = { ...config.traits, [category]: traitId };
    onChange({ ...config, traits: newTraits });
  };

  const currentTraits: Trait[] = getTraits(config.bodyType, activeCategory);
  const hasNone = currentTraits.some((t) => t.id === -1);
  const selectableTraits = currentTraits.filter((t) => t.id !== -1);

  const selectedTraitId = config.traits[activeCategory] ?? -1;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Body type toggle */}
      <div className="flex gap-2 flex-shrink-0">
        {(['bros', 'baes'] as BodyType[]).map((bt) => (
          <button
            key={bt}
            onClick={() => handleBodyTypeChange(bt)}
            className={cn(
              'flex-1 py-1.5 rounded-dash-sm text-sm font-medium uppercase tracking-wider transition-colors',
              config.bodyType === bt
                ? 'bg-dash-accent text-black'
                : 'bg-white/5 text-dash-text-50 hover:bg-white/10'
            )}
          >
            {bt}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0 pb-1">
        {visibleCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded-dash-pill text-xs font-medium capitalize transition-colors',
              activeCategory === cat
                ? 'bg-dash-accent text-black'
                : 'bg-white/5 text-dash-text-50 hover:bg-white/10'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Trait grid */}
      <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 pr-1">
        {/* None option */}
        {hasNone && (
          <button
            onClick={() => handleTraitSelect(activeCategory, -1)}
            className={cn(
              'aspect-square rounded-dash-sm border flex items-center justify-center text-xs font-medium transition-colors',
              selectedTraitId === -1
                ? 'border-dash-accent bg-dash-accent/10 text-dash-accent'
                : 'border-dash-border bg-white/5 text-dash-text-50 hover:border-dash-border-hover'
            )}
          >
            None
          </button>
        )}

        {/* Trait thumbnails */}
        {selectableTraits.map((trait) => {
          const isSelected = selectedTraitId === trait.id;
          const imgSrc = `/avatar/${config.bodyType}/${activeCategory}/${trait.id}.svg`;
          return (
            <button
              key={trait.id}
              onClick={() => handleTraitSelect(activeCategory, trait.id)}
              title={trait.name ?? String(trait.id)}
              className={cn(
                'aspect-square rounded-dash-sm border overflow-hidden transition-colors flex-shrink-0',
                isSelected
                  ? 'border-dash-accent bg-dash-accent/10'
                  : 'border-dash-border bg-white/5 hover:border-dash-border-hover'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={trait.name ?? String(trait.id)}
                className="w-full h-full object-contain"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
