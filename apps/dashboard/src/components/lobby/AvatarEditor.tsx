import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import cn from '../../utils/cn';
import { useAvatarSeed, AvatarCategory } from '../../hooks/useAvatarSeed';
import { AvatarDisplay, ZobuConfig, ZobuLayer, fetchSvgContent } from './AvatarDisplay';
import { TraitPicker } from './TraitPicker';

interface AvatarEditorProps {
  onSave: (svgBlob: Blob, identifier: string) => Promise<void>;
  onClose: () => void;
}

/** Category IDs that are mutually exclusive */
const HAIRSTYLE_ID = 3;
const HATS_ID = 5;
const TOPS_ID = 8;
const BOTTOMS_ID = 7;
const OUTFIT_ID = 11;

export function AvatarEditor({ onSave, onClose }: AvatarEditorProps) {
  const { seed, loading: seedLoading } = useAvatarSeed();
  const [baseId, setBaseId] = useState(1); // 1=Bro, 2=Bae
  const [selectedAssets, setSelectedAssets] = useState<Record<number, number | null>>({});
  const [zobuConfig, setZobuConfig] = useState<ZobuConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zobuRef = useRef<SVGSVGElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Load base SVG when baseId or seed changes
  useEffect(() => {
    if (!seed) return;
    const base = seed.bases.find((b) => b.id === baseId);
    if (!base) return;

    fetchSvgContent(base.file).then(async (baseSvg) => {
      // Initialize layers from categories
      const layers: ZobuLayer[] = seed.categories
        .filter((c) => c.id !== 1) // Skip "Base" category (rendered separately)
        .map((c) => ({
          categoryId: c.id,
          order: c.order,
          assetId: selectedAssets[c.id] ?? null,
          svg: null,
        }));

      // Auto-apply Hand asset (category 9)
      const handCat = seed.categories.find((c) => c.id === 9);
      const handAsset = handCat?.assets[0];
      if (handAsset) {
        const handSvg = await fetchSvgContent(handAsset.file);
        const handLayer = layers.find((l) => l.categoryId === 9);
        if (handLayer) {
          handLayer.assetId = handAsset.id;
          handLayer.svg = handSvg;
        }
      }

      setZobuConfig({ baseId, baseSvg, layers });

      // Load SVGs for any selected assets
      layers.forEach((layer) => {
        if (layer.assetId && layer.categoryId !== 9) {
          loadAssetSvg(layer.categoryId, layer.assetId);
        }
      });
    });
  }, [seed, baseId]);

  const loadAssetSvg = useCallback(
    async (categoryId: number, assetId: number) => {
      if (!seed) return;
      const cat = seed.categories.find((c) => c.id === categoryId);
      const asset = cat?.assets.find((a) => a.id === assetId);
      if (!asset) return;

      const svg = await fetchSvgContent(asset.file);

      setZobuConfig((prev) => {
        if (!prev) return prev;
        const newLayers = prev.layers.map((l) =>
          l.categoryId === categoryId ? { ...l, assetId, svg } : l
        );
        return { ...prev, layers: newLayers };
      });
    },
    [seed]
  );

  const handleAssetSelect = useCallback(
    async (categoryId: number, assetId: number | null) => {
      const newSelected = { ...selectedAssets, [categoryId]: assetId };

      // Mutual exclusivity rules
      if (categoryId === HAIRSTYLE_ID && assetId) {
        newSelected[HATS_ID] = null;
      }
      if (categoryId === HATS_ID && assetId) {
        newSelected[HAIRSTYLE_ID] = null;
      }
      if (categoryId === OUTFIT_ID && assetId) {
        newSelected[TOPS_ID] = null;
        newSelected[BOTTOMS_ID] = null;
      }
      if ((categoryId === TOPS_ID || categoryId === BOTTOMS_ID) && assetId) {
        newSelected[OUTFIT_ID] = null;
      }

      setSelectedAssets(newSelected);

      // Update zobuConfig layers (preserve hand — category 9 — always)
      setZobuConfig((prev) => {
        if (!prev) return prev;
        const newLayers = prev.layers.map((l) => {
          if (l.categoryId === 9) return l; // never touch hands
          const newAssetId = newSelected[l.categoryId] ?? null;
          if (newAssetId === null) return { ...l, assetId: null, svg: null };
          if (newAssetId === l.assetId) return l; // unchanged
          return { ...l, assetId: newAssetId, svg: null }; // will be loaded
        });
        return { ...prev, layers: newLayers };
      });

      // Load SVG for the selected asset
      if (assetId) {
        await loadAssetSvg(categoryId, assetId);
      }

      // Clear SVGs for deselected categories (never touch hands)
      for (const [catIdStr, aId] of Object.entries(newSelected)) {
        const catId = Number(catIdStr);
        if (aId === null && catId !== 9) {
          setZobuConfig((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              layers: prev.layers.map((l) =>
                l.categoryId === catId ? { ...l, assetId: null, svg: null } : l
              ),
            };
          });
        }
      }
    },
    [selectedAssets, loadAssetSvg]
  );

  const handleBaseChange = useCallback(
    (newBaseId: number) => {
      setBaseId(newBaseId);
      setSelectedAssets({});
    },
    []
  );

  const handleRandom = useCallback(() => {
    if (!seed) return;
    const newSelected: Record<number, number | null> = {};

    seed.categories
      .filter((c) => c.id !== 1) // Skip Base
      .forEach((cat) => {
        const available = cat.assets.filter(
          (a) => !a.bases || a.bases.length === 0 || a.bases.includes(baseId)
        );
        if (available.length > 0 && Math.random() > 0.3) {
          const pick = available[Math.floor(Math.random() * available.length)];
          newSelected[cat.id] = pick.id;
        } else {
          newSelected[cat.id] = null;
        }
      });

    // Apply mutual exclusivity
    if (newSelected[OUTFIT_ID]) {
      newSelected[TOPS_ID] = null;
      newSelected[BOTTOMS_ID] = null;
    }
    if (newSelected[HATS_ID]) {
      newSelected[HAIRSTYLE_ID] = null;
    }

    setSelectedAssets(newSelected);

    // Rebuild config — base stays, reload all asset SVGs
    const base = seed.bases.find((b) => b.id === baseId);
    if (!base) return;

    fetchSvgContent(base.file).then(async (baseSvg) => {
      const layers: ZobuLayer[] = seed.categories
        .filter((c) => c.id !== 1)
        .map((c) => ({
          categoryId: c.id,
          order: c.order,
          assetId: newSelected[c.id] ?? null,
          svg: null,
        }));

      // Auto-apply Hand asset (category 9)
      const handCat = seed.categories.find((c) => c.id === 9);
      const handAsset = handCat?.assets[0];
      if (handAsset) {
        const handSvg = await fetchSvgContent(handAsset.file);
        const handLayer = layers.find((l) => l.categoryId === 9);
        if (handLayer) {
          handLayer.assetId = handAsset.id;
          handLayer.svg = handSvg;
        }
      }

      setZobuConfig({ baseId, baseSvg, layers });

      // Load all selected SVGs
      Object.entries(newSelected).forEach(([catIdStr, assetId]) => {
        if (assetId) loadAssetSvg(Number(catIdStr), assetId);
      });
    });
  }, [seed, baseId, loadAssetSvg]);

  const handleSave = useCallback(async () => {
    if (!zobuConfig) return;
    setSaving(true);
    setError(null);
    try {
      // Build identifier: "baseId@catId-assetId,catId-assetId,..."
      const layersEncoded = zobuConfig.layers
        .map((l) => `${l.categoryId}-${l.assetId ?? 'null'}`)
        .join(',');
      const identifier = `${baseId}@${layersEncoded}`;

      // Build SVG blob from the current display
      const sortedLayers = [...zobuConfig.layers].sort((a, b) => a.order - b.order);
      const innerSvg =
        `<g>${zobuConfig.baseSvg}</g>` +
        sortedLayers
          .filter((l) => l.svg)
          .map((l) => `<g>${l.svg}</g>`)
          .join('');
      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" fill="none" viewBox="0 0 512 512">${innerSvg}</svg>`;
      const blob = new Blob([fullSvg], { type: 'image/svg+xml' });

      await onSave(blob, identifier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [zobuConfig, baseId, onSave]);

  if (seedLoading || !seed) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 text-dash-text-50 text-sm">Loading avatar editor...</div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col',
          'bg-dash-bg backdrop-blur-dash-heavy border border-dash-border',
          'rounded-dash-lg shadow-dash-card overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 border-b border-dash-border flex-shrink-0">
          <h2 className="text-dash-text font-semibold text-base sm:text-lg">Customise your Zobu</h2>
          <button
            onClick={onClose}
            className="text-dash-text-50 hover:text-dash-text transition-colors text-xl p-1"
          >
            ✕
          </button>
        </div>

        {/* Body — stacks vertically on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 sm:p-6 flex-shrink-0 bg-black/20 sm:border-r border-b sm:border-b-0 border-dash-border sm:w-[240px]">
            <AvatarDisplay zobuConfig={zobuConfig} size={140} />
          </div>

          {/* Trait picker */}
          <div className="flex-1 px-4 sm:px-7 py-4 sm:py-6 overflow-hidden min-h-0">
            <TraitPicker
              categories={seed.categories}
              baseId={baseId}
              selectedAssets={selectedAssets}
              onBaseChange={handleBaseChange}
              onAssetSelect={handleAssetSelect}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 border-t border-dash-border flex-shrink-0 gap-4">
          <span className="text-red-400 text-xs sm:text-sm flex-1 truncate">{error ?? ''}</span>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleRandom}
              disabled={saving}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-dash-sm text-sm font-medium bg-white/5 text-dash-text-80 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Random
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'px-4 sm:px-5 py-2 sm:py-2.5 rounded-dash-sm text-sm font-medium transition-colors',
                saving
                  ? 'bg-white/10 text-dash-text-40 cursor-not-allowed'
                  : 'bg-white/20 text-dash-text border border-dash-border hover:bg-white/30'
              )}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
