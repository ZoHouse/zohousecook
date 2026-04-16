import Image from 'next/image';
import bosseZo from '../../assets/passport-lobby/portrait/bosse-zo-placeholder.png';

export interface Avatar2DProps {
  avatarUrl: string | undefined;
  displayName: string;
}

export function Avatar2D({ avatarUrl, displayName }: Avatar2DProps) {
  return (
    <div
      className="w-full aspect-square overflow-hidden flex items-center justify-center"
      style={{ background: '#F1E5D0', borderRadius: 12 }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
      ) : (
        <Image
          src={bosseZo}
          alt={displayName}
          width={204}
          height={204}
          className="w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      )}
    </div>
  );
}
