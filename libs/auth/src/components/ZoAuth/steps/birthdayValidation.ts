export type ValidationResult =
  | { ok: true; warning?: string }
  | { ok: false; reason: string };

export function validateBirthday(
  input: string,
  today: Date = new Date()
): ValidationResult {
  if (!input) return { ok: false, reason: "Pick a date" };

  // Strict ISO date parse — reject invalid dates like Feb 30
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return { ok: false, reason: "Not a real date" };

  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false, reason: "Not a real date" };
  }

  if (date > today) {
    return { ok: false, reason: "Pick a date in the past" };
  }

  // Compute age in full years
  let age = today.getUTCFullYear() - year;
  const m = today.getUTCMonth() - (month - 1);
  if (m < 0 || (m === 0 && today.getUTCDate() < day)) {
    age--;
  }

  if (age < 13) {
    return { ok: false, reason: "Sorry, Zo World is 13+" };
  }

  if (age > 120) {
    return { ok: true, warning: "Hmm, double-check that" };
  }

  return { ok: true };
}
