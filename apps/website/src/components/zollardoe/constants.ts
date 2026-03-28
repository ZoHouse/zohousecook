export const ZO_TOKEN = {
  name: "$Zo",
  symbol: "Zo",
  chain: "Base",
  chainId: 8453,
  decimals: 18,
  address: "0x111142c7ecaf39797b7865b82034269962142069",
  totalSupply: "1,000,000,000,000",
  explorer: "https://basescan.org",
}

export const CONTRACTS = [
  {
    name: "$Zo Token",
    address: "0x111142c7ecaf39797b7865b82034269962142069",
    chain: "Base",
    standard: "ERC-20 (Proxy)",
    explorer: "https://basescan.org",
    functions: ["batchTransferFrom", "transfer", "approve", "allowance"],
    notes: "Upgradeable proxy (ERC1967). 18 decimals. 1T total supply.",
  },
  {
    name: "Founder NFT",
    address: "0xF9e631014Ce1759d9B76Ce074D496c3da633BA12",
    chain: "Ethereum",
    standard: "ERC-721",
    explorer: "https://etherscan.io",
    functions: ["mint", "mintEarly", "mintGrant"],
    notes: "1111 supply. Minting via JoinZo proxy (0xeEf680d493640228797d75Dd3dFF2B49609eD306).",
  },
  {
    name: "Citizen NFT",
    address: "0x135d8310fccF9f51Ca43a1cDd627ea93554F4EDC",
    chain: "Base",
    standard: "ERC-721",
    explorer: "https://basescan.org",
    functions: ["mint", "bulkMint"],
    notes: "Auto-minted on user signup. Avatar from avatar.zoworld.io.",
  },
  {
    name: "POA",
    address: "0x24a82ccfC5C0e45EC9d130b1aa97B58f9344EA80",
    chain: "Base",
    standard: "ERC-1155",
    explorer: "https://basescan.org",
    functions: ["mint", "bulkMint"],
    notes: "Proof of Attendance. Admin creates, users claim, Celery batch-mints.",
  },
]

export const API_ENDPOINTS = [
  { method: "GET", path: "/api/v1/webthree/ledger/balance/", auth: "User", purpose: "User's $Zo balance" },
  { method: "GET", path: "/api/v1/webthree/ledger/transactions/", auth: "User", purpose: "Transfer history" },
  { method: "GET", path: "/api/v1/webthree/token-airdrops/summary/", auth: "User", purpose: "Airdrop totals" },
  { method: "GET", path: "/api/v1/webthree/token-airdrops/", auth: "User", purpose: "Airdrop list" },
  { method: "GET", path: "/api/v1/cas/token-grants/", auth: "CAS Admin", purpose: "All grants (CRUD)" },
  { method: "GET", path: "/api/v1/cas/token-airdrops/", auth: "CAS Admin", purpose: "All airdrops (CRUD)" },
  { method: "POST", path: "/api/v1/cas/rewards/vibe-curators/", auth: "CAS Admin", purpose: "Issue vibe curator rewards" },
  { method: "POST", path: "/api/v1/zoprofile/onboarding-grants/", auth: "User", purpose: "Claim onboarding grant" },
  { method: "POST", path: "/webthree/poa/{id}/claim/", auth: "User", purpose: "Claim POA NFT" },
  { method: "GET", path: "/webthree/poa/{id}/status/", auth: "User", purpose: "POA claim status" },
  { method: "GET", path: "/webthree/poa/metadata/{ref_id}.json", auth: "Public", purpose: "POA ERC-1155 metadata" },
]

export const SCHEDULED_TASKS = [
  { task: "handle_bulk_airdrop_tokens", freq: "10 min", purpose: "Batch PENDING $Zo airdrops → on-chain tx" },
  { task: "process_evm_transactions", freq: "60 sec", purpose: "Execute + track pending EVM txs" },
  { task: "update_token_ledger_from_chain", freq: "10 min", purpose: "Sync Transfer events to ledger" },
  { task: "handle_bulk_poa_airdrop", freq: "10 min", purpose: "Batch-mint POA NFTs" },
  { task: "bulk_airdrop_citizenship_tokens", freq: "10 min", purpose: "Batch-mint Citizen NFTs" },
  { task: "verify_delegated_wallets", freq: "periodic", purpose: "Re-verify delegate.cash delegations" },
]

export const KEY_FILES = {
  "Token Distribution": [
    "webthree/models.py — TokenGrant, TokenAirdrop, TokenLedger, EVMContract, EVMTransaction",
    "webthree/tasks.py — handle_bulk_airdrop_tokens, process_evm_transactions",
    "webthree/signals.py — EVMTransaction status change handlers",
    "cas/views/rewards.py — VibeCuratorRewardsView",
    "cas/views/webthree.py — TokenGrantViewset, TokenAirdropViewset",
  ],
  "Profile Completion Grants": [
    "zoprofile/models.py — ProfileCompletionGrant, ProfileCompletionGrantClaim",
    "zoprofile/views.py — ProfileOnboardingGrantsView",
    "zoprofile/tasks.py — claim_profile_completion_grant",
  ],
  "Onboarding (Wallet + Citizen)": [
    "custodian/models.py — Wallet (HD wallet gen, AES encryption)",
    "authentication/models/user.py — create_custodial_wallet signal",
    "authentication/models/user_indentity.py — create_citizenship signal",
    "authentication/tasks.py — create_custodial_wallet_for_user",
    "zoprofile/models.py — Citizenship model + airdrop() manager",
    "zoprofile/tasks.py — bulk_airdrop_citizenship_tokens",
  ],
  "Founder NFTs": [
    "webthree/contracts/founder.py — Founder NFT ABI + address",
    "webthree/contracts/joinzo.py — JoinZo minting proxy ABI + address",
    "webthree/contracts/delegate.py — delegate.cash registry",
    "webthree/listeners/founder.py — Ethereum Transfer event poller",
    "webthree/models.py — TokenHodl, FounderAllowlist, FounderWallet",
    "authentication/tasks.py — update_founder_membership_and_perks",
  ],
  "POA NFTs": [
    "webthree/models.py — POA, POAHolder",
    "webthree/views.py — POAViewset, PublicPOAViewset, POAMetadataView",
    "webthree/tasks.py — handle_bulk_poa_airdrop, initiate_bulk_poa_airdrops",
  ],
}

export const FLOWS = {
  zo_distribution: {
    title: "$Zo Token Distribution",
    content: `Pipeline: Trigger → TokenAirdrop (PENDING) → Celery batch (every 10 min) → batchTransferFrom on Base

Trigger A — Profile Completion (automatic):
User fills profile field → post_save signal → ProfileCompletionGrant match → ProfileCompletionGrantClaim → TokenAirdrop created

Trigger B — Vibe Curator (manual):
CAS admin → POST /cas/rewards/vibe-curators/ → creates custodial wallet if needed → TokenAirdrop created

Batch execution:
handle_bulk_airdrop_tokens (every 10 min) → picks oldest grant with PENDING airdrops → batches 100 → batchTransferFrom → EVMTransaction → process_evm_transactions (every 60s) → broadcast → track receipt → SUCCESS/FAILED

Status lifecycle: PENDING → INITIATED → SUCCESS / FAILED / CANCELLED`,
  },
  onboarding: {
    title: "New User Onboarding (Wallet + Citizen NFT)",
    content: `Full chain:
Sign up (mobile OTP / email / Google / Apple / wallet / Telegram)
→ User record created (post_save creates Profile)
→ Identity verified
→ User.verified = True
→ post_save fires create_custodial_wallet_for_user task
→ BIP-39 mnemonic generated (12 words, 128-bit)
→ Derived via HD path m/44'/60'/0'/0/0
→ Seedphrase AES-encrypted (CFB mode) with CUSTODIAN_WALLETS_ENCRYPTION_KEY
→ UserWeb3Wallet created (is_custodial=True)
→ post_save fires create_citizenship_on_user_wallet_save
→ Citizenship record created
→ Avatar generated via avatar.zoworld.io → SVG saved to S3
→ bulk_airdrop_citizenship_tokens (every 10 min) → bulkMint on Base`,
  },
  founder: {
    title: "Founder NFTs",
    content: `Allowlist + Mint:
Existing founder → POST /webthree/founder/al/ (refers ONE wallet)
→ FounderAllowlist (PENDING → APPROVED)
→ Backend signs wallet with JOINZO_PRIVATE_KEY (keccak256)
→ User calls JoinZo.mint(signature) on-chain with ETH
→ Founder NFT transferred

Ownership tracking:
Blockchain listener polls Ethereum for Transfer events → upserts TokenHodl
→ post_save signal → FounderWallet created → update_founder_membership_and_perks
→ User.membership = "founder"

Delegation:
delegate.cash v1 (0x0000...38B) → vault delegates to hot wallet
→ UserWeb3Wallet.verify_delegation() checks on-chain
→ Delegated wallets inherit founder status + see vault's tokens

Perks: Zo House access, exclusive drops, events, Zo Studio, Zo Club, founders chat thread, @zomadbot announcement, allowlist referral`,
  },
  poa: {
    title: "POA (Proof of Attendance) NFTs",
    content: `Flow:
Admin creates POA in Django admin (title, contract, token_ref_id, claim window)
→ User claims: POST /webthree/poa/{id}/claim/ { wallet_address }
→ POAHolder created (PENDING)
→ handle_bulk_poa_airdrop (every 10 min) → batches 100
→ bulkMint(addresses, tokenId, 1, 0x) on ERC-1155
→ EVMTransaction tracked → POAHolder → SUCCESS + TokenHodl

Contract: 0x24a8...EA80 (Base, ERC-1155)
Claim window enforced: must be between claim_start and claim_end
One per wallet: unique constraint on (poa, wallet_address)
Metadata: served by Django at /webthree/poa/metadata/{token_ref_id}.json`,
  },
}

export const AIRDROP_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "#faad14" },
  1: { label: "Initiated", color: "#1890ff" },
  2: { label: "Success", color: "#52c41a" },
  3: { label: "Failed", color: "#ff4d4f" },
  4: { label: "Cancelled", color: "#666" },
}
