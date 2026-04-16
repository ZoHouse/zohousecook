import Image from 'next/image';
import quest from '../../assets/pass-quest.png';
import earn from '../../assets/pass-earn.png';
import create from '../../assets/pass-create.png';
import host from '../../assets/pass-host.png';
import type { ProUpsellFeature } from '../pro';

export interface PassesDockProps { onUpsell: (feature: ProUpsellFeature) => void }

const TILES: Array<{ feature: ProUpsellFeature; label: string; src: typeof quest }> = [
  { feature: 'quest-pass', label: 'Quest', src: quest },
  { feature: 'earn-pass', label: 'Earn', src: earn },
  { feature: 'create-pass', label: 'Create', src: create },
  { feature: 'host-pass', label: 'Host', src: host },
];

export function PassesDock({ onUpsell }: PassesDockProps) {
  return (
    <div className="px-3 py-3 bg-[#0a0a0a]">
      <div className="grid grid-cols-4 gap-1.5">
        {TILES.map((tile) => (
          <button
            key={tile.feature}
            onClick={() => onUpsell(tile.feature)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 flex flex-col items-center gap-1 text-white text-[10px] font-semibold"
          >
            <Image src={tile.src} alt="" width={28} height={28} />
            {tile.label}
            <span className="text-neutral-500 text-[8px] font-normal">Apply</span>
          </button>
        ))}
      </div>
    </div>
  );
}
