import { useState } from 'react';
import { CitizenCard, type CitizenCardProps } from './CitizenCard';
import { StandingAvatar3D } from './StandingAvatar3D';

export interface HeroStageProps {
  citizenProps: Omit<CitizenCardProps, 'onClick'>;
}

type View = 'card' | 'avatar';

// Renders the swappable hero on the lobby pedestal. Tapping the card flips
// to the 3D Zobu in-place; tapping the 3D Zobu flips back. Same footprint
// either way so the pedestal beneath doesn't shift.
export function HeroStage({ citizenProps }: HeroStageProps) {
  const [view, setView] = useState<View>('card');
  const flip = () => setView((v) => (v === 'card' ? 'avatar' : 'card'));

  return view === 'card'
    ? <CitizenCard {...citizenProps} onClick={flip} />
    : <StandingAvatar3D onClick={flip} />;
}
