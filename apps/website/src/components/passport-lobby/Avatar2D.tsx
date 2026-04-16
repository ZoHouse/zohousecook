export interface Avatar2DProps {
  avatarUrl: string | undefined;
  displayName: string;
}

export function Avatar2D({ avatarUrl, displayName }: Avatar2DProps) {
  if (!avatarUrl) {
    return (
      <div className="w-full aspect-square rounded-xl bg-[#f1e0c4] flex items-end justify-center text-neutral-500 text-xs">
        {displayName[0]?.toUpperCase() ?? '?'}
      </div>
    );
  }
  return (
    <div className="w-full aspect-square rounded-xl bg-[#f1e0c4] overflow-hidden flex items-end justify-center">
      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
    </div>
  );
}
