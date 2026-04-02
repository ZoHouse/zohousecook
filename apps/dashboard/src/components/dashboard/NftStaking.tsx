import React, { useState, useEffect, useRef } from "react";
import { ZoSpinner } from "../ui/ZoSpinner";
import { GlassCard } from "./GlassCard";
import { useMyNfts, MyNft } from "../../hooks/useMyNfts";

// Simulated staking rate: $Zo earned per NFT per second
const ZO_PER_NFT_PER_SECOND = 0.0023;

function StakingModal({ onClose, nfts }: { onClose: () => void; nfts: MyNft[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleNft = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === nfts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(nfts.map((n) => n.token_ref_id)));
    }
  };

  const count = selected.size;
  const dailyReward = count * ZO_PER_NFT_PER_SECOND * 86400;
  const weeklyReward = dailyReward * 7;
  const monthlyReward = dailyReward * 30;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-dash-bg-solid border border-dash-border rounded-2xl p-8 w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dash-text">Stake Founder NFTs</h2>
          <button onClick={onClose} className="text-dash-text-40 hover:text-dash-text text-xl">&times;</button>
        </div>

        {/* Select / Deselect all */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-dash-text-50">
            {count} of {nfts.length} selected
          </span>
          <button onClick={selectAll} className="text-xs text-dash-accent hover:underline">
            {selected.size === nfts.length ? "Deselect all" : "Select all"}
          </button>
        </div>

        {/* NFT list — clickable to select */}
        <div className="grid grid-cols-2 gap-3 mb-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {nfts.map((nft) => {
            const isSelected = selected.has(nft.token_ref_id);
            return (
              <div
                key={nft.token_ref_id}
                onClick={() => toggleNft(nft.token_ref_id)}
                className={`relative rounded-xl border cursor-pointer transition-all overflow-hidden ${
                  isSelected
                    ? "border-green-500/50 ring-1 ring-green-500/30"
                    : "border-dash-border hover:border-dash-border-hover"
                }`}
              >
                {/* NFT image */}
                {nft.image_url ? (
                  <img src={nft.image_url} alt={nft.name} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-dash-border flex items-center justify-center text-dash-text-40 text-sm">
                    {nft.name}
                  </div>
                )}

                {/* Checkbox overlay */}
                <div className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  isSelected ? "bg-green-500 border-green-500" : "bg-black/40 border-white/30"
                }`}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                  <p className="text-xs text-dash-text-80 truncate">{nft.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reward projections */}
        {count > 0 && (
          <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 mb-4">
            <p className="text-[10px] text-green-400/70 uppercase tracking-wider mb-2">
              Projected Rewards for {count} NFT{count > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-semibold text-green-400 font-mono">{dailyReward.toFixed(1)}</p>
                <p className="text-[9px] text-dash-text-40">$Zo / day</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-400 font-mono">{weeklyReward.toFixed(1)}</p>
                <p className="text-[9px] text-dash-text-40">$Zo / week</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-400 font-mono">{monthlyReward.toFixed(0)}</p>
                <p className="text-[9px] text-dash-text-40">$Zo / month</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            disabled={count === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              count > 0
                ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                : "bg-white/5 text-dash-text-40 border-dash-border cursor-not-allowed"
            }`}
          >
            Stake {count > 0 ? `(${count})` : ""}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 text-dash-text-50 text-sm font-medium hover:bg-white/10 transition-colors border border-dash-border"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function EarningsTicker({ nftCount }: { nftCount: number }) {
  const [earned, setEarned] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (nftCount === 0) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setEarned(elapsed * nftCount * ZO_PER_NFT_PER_SECOND);
    }, 100);
    return () => clearInterval(interval);
  }, [nftCount]);

  if (nftCount === 0) return null;

  return (
    <div className="text-center py-1.5 px-3 rounded-lg bg-green-500/10 border border-green-500/20">
      <span className="text-[10px] text-green-400/70">Potential earnings: </span>
      <span className="text-xs text-green-400 font-mono font-semibold">
        +{earned.toFixed(4)} $Zo
      </span>
    </div>
  );
}

export function NftStaking() {
  const { nfts, isLoading } = useMyNfts();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <GlassCard className="p-dash-xl flex flex-col">
        <div className="flex items-center justify-between mb-dash-lg">
          <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider">
            Founder NFTs
          </h3>
          {nfts.length > 0 && (
            <span className="text-xs text-dash-text-40">{nfts.length} NFTs</span>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[120px]">
            <ZoSpinner size={32} />
          </div>
        ) : nfts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[120px]">
            <p className="text-dash-text-40 text-sm">No Founder NFTs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-[200px] scrollbar-hide mb-3">
              <div className="grid grid-cols-2 gap-3">
                {nfts.map((nft: MyNft) => (
                  <div
                    key={nft.token_ref_id}
                    className="relative rounded-dash-md overflow-hidden border border-dash-border"
                  >
                    {nft.image_url ? (
                      <img
                        src={nft.image_url}
                        alt={nft.name}
                        className="w-full aspect-square object-cover block"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-dash-border flex items-center justify-center text-dash-text-40 text-xs">
                        {nft.name}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                      <p className="text-[10px] text-dash-text-80 truncate">
                        {nft.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings ticker */}
            <EarningsTicker nftCount={nfts.length} />

            {/* Stake & Claim buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors border border-green-500/30"
              >
                Stake
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 py-2 rounded-xl bg-dash-accent/20 text-dash-accent text-xs font-medium hover:bg-dash-accent/30 transition-colors border border-dash-accent/30"
              >
                Claim
              </button>
            </div>
          </>
        )}
      </GlassCard>

      {showModal && <StakingModal onClose={() => setShowModal(false)} nfts={nfts} />}
    </>
  );
}
