// Strips Zo's ".zo" suffix and rejects values that aren't usable as a
// human customer name — ENS-shaped handles (`vitalik.eth`), raw wallet
// addresses (`0x…`), the literal placeholder "ens" some profile rows ship
// with, and anything too short to be a name. Without these guards the
// kitchen ticket prints garbage like "Customer: ens" for any wallet-only
// user whose first_name isn't set.
export function cleanNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/\.zo$/i, '').trim()
  if (!cleaned) return null
  if (/^ens$/i.test(cleaned)) return null
  if (/\.eth$/i.test(cleaned)) return null
  if (/^0x[0-9a-f]+$/i.test(cleaned)) return null
  if (cleaned.length < 2) return null
  return cleaned
}
