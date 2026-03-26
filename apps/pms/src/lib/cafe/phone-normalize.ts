/**
 * Normalize phone to last 10 digits (Indian mobile).
 * Strips +91 prefix, country code, and non-digit characters.
 * Matches the pattern used in cafezomad/[tableId].tsx for order matching.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}
