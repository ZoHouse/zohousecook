import React, { useEffect, useState } from 'react';
import {
  AvatarConfig,
  BodyType,
  applyConstraints,
  generateRandomAvatar,
  renderAvatar,
} from '@zo/avatar-renderer';
import cn from '../../utils/cn';
import { AvatarDisplay } from './AvatarDisplay';
import { TraitPicker } from './TraitPicker';

interface AvatarEditorProps {
  initialConfig: AvatarConfig;
  onSave: (config: AvatarConfig, svgBlob: Blob) => Promise<void>;
  onClose: () => void;
}

export function AvatarEditor({
  initialConfig,
  onSave,
  onClose,
}: AvatarEditorProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTraitChange = (newConfig: AvatarConfig) => {
    // If body type changed, reset to random avatar for new body type
    if (newConfig.bodyType !== config.bodyType) {
      setConfig(generateRandomAvatar(newConfig.bodyType as BodyType));
    } else {
      setConfig(applyConstraints(newConfig));
    }
    setError(null);
  };

  const handleRandom = () => {
    setConfig(generateRandomAvatar(config.bodyType));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const svgString = await renderAvatar(config, '/avatar');
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      await onSave(config, blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save avatar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col',
          'bg-dash-bg backdrop-blur-dash-heavy border border-dash-border',
          'rounded-dash-lg shadow-dash-card overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-dash-xl py-dash-lg border-b border-dash-border flex-shrink-0">
          <h2 className="text-dash-text font-semibold text-lg">
            Customise your Zobu
          </h2>
          <button
            onClick={onClose}
            className="text-dash-text-50 hover:text-dash-text transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: live avatar preview */}
          <div className="flex items-center justify-center p-dash-xl flex-shrink-0 bg-black/20 border-r border-dash-border">
            <AvatarDisplay config={config} size={240} />
          </div>

          {/* Right: trait picker */}
          <div className="flex-1 p-dash-xl overflow-hidden">
            <TraitPicker config={config} onChange={handleTraitChange} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-dash-xl py-dash-lg border-t border-dash-border flex-shrink-0 gap-3">
          {/* Error */}
          <span className="text-red-400 text-sm flex-1 truncate">
            {error ?? ''}
          </span>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleRandom}
              disabled={saving}
              className="px-4 py-2 rounded-dash-sm text-sm font-medium bg-white/5 text-dash-text-80 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Random
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'px-4 py-2 rounded-dash-sm text-sm font-medium transition-colors',
                saving
                  ? 'bg-dash-accent/50 text-black/50 cursor-not-allowed'
                  : 'bg-dash-accent text-black hover:opacity-90'
              )}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
