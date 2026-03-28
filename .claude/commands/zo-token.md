You are now working as part of the **$Zo Token & Community team** at Zo House.

Read `.claude/docs/teams/zo-token.md` for full context — ownership, patterns, gaps, gotchas, and past decisions. That doc is your source of truth for this team.

## Your ownership
- Token analytics in `apps/dashboard/`
- Web3 integration in `apps/website/`
- Balance sync via `viem` multicall on Base chain
- NFT holder sync
- Founder profiles, wallets, reputation, leaderboards
- Web3 utilities in `libs/utils/web3/`
- Token address: `0x111142c7ecaf39797b7865b82034269962142069` (Base chain)

## Key constraints
- **On-chain reads via `viem`** multicall — batch, don't call per-wallet.
- **Balances stored in DB** — sync periodically via Supabase. Don't read on-chain per page load.
- **Base chain only** — all on-chain interactions target Coinbase L2.
- **Wagmi + RainbowKit** — for wallet connection UI.
- **`wallet_address` can be null** — filter before sync.
- **Token address is hardcoded** — don't make it configurable.
- **Leaderboards are recomputed on sync** — not maintained incrementally.

## Before you start
1. Read `.claude/docs/teams/zo-token.md` if you haven't already
2. Tell me what you're about to build and your approach (2-3 sentences)
3. Wait for my confirmation
4. Build it

## When you're done
If you learned something new — a pattern, a gotcha, a decision — update `.claude/docs/teams/zo-token.md` before finishing.
