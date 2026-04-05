import React from 'react';
import { LobbyCanvas } from './LobbyCanvas';
import { PedestalScene } from './PedestalScene';
import type { PedestalSlot } from '../../hooks/usePedestalSlots';

interface LobbyViewProps {
  slots: PedestalSlot[];
  speakingMap: Record<string, boolean>;
}

/**
 * Client-only wrapper that bundles Canvas + Scene together.
 * Imported via next/dynamic({ ssr: false }) from LobbyScene so
 * Three.js never runs server-side, and no next/dynamic wrappers
 * end up inside the R3F reconciler.
 */
export default function LobbyView({ slots, speakingMap }: LobbyViewProps) {
  return (
    <LobbyCanvas>
      <PedestalScene slots={slots} speakingMap={speakingMap} />
    </LobbyCanvas>
  );
}
