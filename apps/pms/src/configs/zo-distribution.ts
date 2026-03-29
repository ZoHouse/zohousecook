export const ZO_TOKEN_CONTRACT = "0x111142c7ecaf39797b7865b82034269962142069"
export const BASESCAN_URL = "https://basescan.org"

export const AIRDROP_STATUS = {
  PENDING: 0,
  INITIATED: 1,
  SUCCESS: 2,
  FAILED: 3,
  CANCELLED: 4,
} as const

export const AIRDROP_STATUS_LABELS: Record<number, { label: string; color: string }> = {
  [AIRDROP_STATUS.PENDING]: { label: "Pending", color: "warning" },
  [AIRDROP_STATUS.INITIATED]: { label: "Initiated", color: "processing" },
  [AIRDROP_STATUS.SUCCESS]: { label: "Success", color: "success" },
  [AIRDROP_STATUS.FAILED]: { label: "Failed", color: "error" },
  [AIRDROP_STATUS.CANCELLED]: { label: "Cancelled", color: "default" },
}

// Map Zo House operator codes to their city distribution wallet addresses.
// Retrieve these from CAS admin (/misc/zo-points) or the token-grants API.
// If empty, the page will show an info alert prompting configuration.
export const OPERATOR_CITY_WALLETS: Record<string, string> = {
  "BNGHO812": "", // Koramangala — fill from CAS admin
  "BNGS531": "",  // Whitefield — fill from CAS admin
}

