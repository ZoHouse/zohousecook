import { CitizenCard, type CitizenCardProps } from './CitizenCard';
import { StandingAvatar3D } from './StandingAvatar3D';

export interface HeroStageProps {
  tier: 'free' | 'pro';
  citizenProps: Omit<CitizenCardProps, 'onUpsell'>;
  xpInLevel: number;
  xpLevelTotal: number;
  onUpsell: () => void;
}

export function HeroStage({ tier, citizenProps, xpInLevel, xpLevelTotal, onUpsell }: HeroStageProps) {
  if (tier === 'pro') return <StandingAvatar3D xpInLevel={xpInLevel} xpLevelTotal={xpLevelTotal} />;
  return <CitizenCard {...citizenProps} onUpsell={onUpsell} />;
}
