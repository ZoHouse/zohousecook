import Image from 'next/image';
import map from '../../assets/map-bangalore.png';

const GRADIENT_MAP = 'linear-gradient(169deg, #F4F2F2 0%, #8E8D8D 100%)';

export function MapWidget() {
  return (
    <div
      className="relative"
      style={{
        width: 110,
        height: 74,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <Image src={map} alt="" width={110} height={74} className="w-full h-full object-cover" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: GRADIENT_MAP, mixBlendMode: 'multiply', opacity: 0.6 }}
        aria-hidden
      />
    </div>
  );
}
