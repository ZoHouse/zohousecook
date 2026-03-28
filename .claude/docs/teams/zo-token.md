# $Zo Token & Community Team

## Mission

Align incentives across Zo House using the $Zo token. Track emissions, analyze on-chain activity, and build the cultural flywheel that rewards builders for contributing to the community. The token is the coordination layer.

## Ownership

### Apps: `apps/website/` + `apps/dashboard/`

| Area | App | Purpose |
|------|-----|---------|
| Token analytics | `apps/dashboard/` | $Zo token balance tracking, holder analytics, leaderboards |
| Web3 integration | `apps/website/` | Wallet connection, NFT features, public token info |
| Founder profiles | `apps/dashboard/` | Founder metrics, reputation, wallet management |

### Web3 Stack

- **Wagmi** — React hooks for Ethereum
- **Viem** — TypeScript interface for Ethereum
- **RainbowKit** — Wallet connection UI
- **Base chain** — All on-chain interactions target Coinbase L2
- **Shared web3 utils** — `libs/utils/web3/`

### Token Details

- Token address: `0x111142c7ecaf39797b7865b82034269962142069` (Base chain)
- Token address is hardcoded — don't make it configurable

## Patterns to Follow

- **On-chain reads via `viem`** — use multicall to batch reads, don't call per-wallet.
- **Balances stored in DB** — sync periodically via Supabase, serve from DB. Don't read on-chain per page load.
- **Base chain only** — all on-chain interactions target Coinbase L2.
- **Shared utils** — web3 utilities in `libs/utils/web3/`.
- **Pages Router** — consistent with all other apps.

## Known Gaps

- No automated sync schedule — balance sync is manual.
- No token transfer tracking — we track balances but not individual transfers.
- No reputation formula documentation.
- No wallet connection UI for self-service — wallet addresses set manually in DB.

## Watch Out For

- `viem` multicall can fail if too many addresses are batched — chunk requests.
- Base RPC can be slow — sync endpoints need appropriate timeouts.
- `wallet_address` can be null in founder profiles — always filter before sync.
- NFT metadata is cached locally — re-sync needed if contract metadata changes.

## Decisions

- **2026-03-22:** Store balances in DB and sync periodically rather than reading on-chain per request. Reason: performance, RPC rate limits.

---

*Update this doc when you learn something new about the token system. Use `/learn` to trigger a review.*
