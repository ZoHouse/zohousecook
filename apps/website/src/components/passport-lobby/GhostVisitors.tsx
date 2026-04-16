import Image from 'next/image';
import figure from '../../assets/passport-lobby/scene/ghost-figure.svg';
import figureSm from '../../assets/passport-lobby/scene/ghost-figure-sm.svg';

export function GhostVisitors() {
  return (
    <div className="flex gap-1 items-end" aria-hidden>
      <Image src={figure} alt="" width={83} height={123} style={{ width: 48, height: 'auto', opacity: 0.7 }} />
      <Image src={figureSm} alt="" width={75} height={96} style={{ width: 28, height: 'auto', opacity: 0.5 }} />
    </div>
  );
}
