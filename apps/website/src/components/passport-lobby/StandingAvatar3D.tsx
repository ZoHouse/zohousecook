import { Pedestal } from './Pedestal';
import { XpProgressBar } from './XpProgressBar';

export interface StandingAvatar3DProps { xpInLevel: number; xpLevelTotal: number }

export function StandingAvatar3D({ xpInLevel, xpLevelTotal }: StandingAvatar3DProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-32 h-52 rounded-lg mb-[-4px] flex items-center justify-center text-white text-[10px] text-center p-2"
        style={{ background: 'linear-gradient(180deg, #c94d3d 0%, #000 40%, #444 100%)' }}
      >
        3D Zobu<br />(coming with Pro)
      </div>
      <Pedestal />
      <div className="w-20 mt-2">
        <XpProgressBar current={xpInLevel} max={xpLevelTotal || 1} />
      </div>
    </div>
  );
}
