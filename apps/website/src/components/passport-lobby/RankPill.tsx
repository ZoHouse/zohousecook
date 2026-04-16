export interface RankPillProps {
  rank: number;
  avatarUrl?: string;
}

const OLIVE =
  'linear-gradient(138deg, #A7D921 0%, #DCFF80 4%, #3C4B14 55%, #587312 76%, #89B020 95%)';

export function RankPill({ rank, avatarUrl }: RankPillProps) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-neutral-900 pl-1 pr-3 py-1 text-white"
      style={{
        border: '2px solid transparent',
        backgroundImage: `linear-gradient(#202020, #202020), ${OLIVE}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <span
        className="w-5 h-5 rounded-full bg-pink-500 bg-cover bg-center"
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        aria-hidden
      />
      <span className="text-sm font-medium">#{rank}</span>
    </div>
  );
}
