import Image from 'next/image';
import map from '../../assets/map-bangalore.png';

export function MapWidget() {
  return (
    <div className="w-[90px] h-[60px] rounded-xl overflow-hidden">
      <Image src={map} alt="" width={90} height={60} className="w-full h-full object-cover" />
    </div>
  );
}
