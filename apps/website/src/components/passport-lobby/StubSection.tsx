import type { ProUpsellFeature } from '../pro';

export interface StubSectionProps { feature: ProUpsellFeature; title: string; onUpsell: (feature: ProUpsellFeature) => void }

export function StubSection({ feature, title, onUpsell }: StubSectionProps) {
  return (
    <div className="py-16 px-4 text-center">
      <div className="text-white text-lg font-semibold mb-2">{title}</div>
      <div className="text-neutral-500 text-sm mb-6">Coming Soon</div>
      <button
        onClick={() => onUpsell(feature)}
        className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}
