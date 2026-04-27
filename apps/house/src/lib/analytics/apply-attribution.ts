import type { FirstTouch } from "./utm";

interface ApplyAttributionInput {
  firstTouch?: FirstTouch | null;
  heardFrom?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
}

const FIRST_TOUCH_FIELDS: Array<keyof FirstTouch> = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbc",
  "captured_at",
];

function clean(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeLandingPath(value?: string | null): string | null {
  const cleaned = clean(value);
  if (!cleaned) return null;

  const [pathOnly] = cleaned.split("?");
  const normalized = (pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`)
    .replace(/\/+$/g, "") || "/";
  if (normalized === "/" || normalized === "/apply") return null;

  return normalized;
}

export function sanitizeFirstTouch(
  firstTouch?: FirstTouch | null
): FirstTouch | null {
  if (!firstTouch) return null;

  const sanitized: FirstTouch = {
    captured_at: clean(firstTouch.captured_at) || "",
  };

  for (const field of FIRST_TOUCH_FIELDS) {
    if (field === "captured_at") continue;
    const value = clean(firstTouch[field]);
    if (value) {
      sanitized[field] = value;
    }
  }

  const capturedAt = clean(firstTouch.captured_at);
  if (capturedAt) {
    sanitized.captured_at = capturedAt;
  }

  const hasAnyAttribution = FIRST_TOUCH_FIELDS.some((field) => {
    if (field === "captured_at") return false;
    return Boolean(sanitized[field]);
  });

  return hasAnyAttribution ? sanitized : null;
}

export function deriveReferralSource(
  heardFrom?: string | null,
): string | null {
  return clean(heardFrom);
}

export function buildAttributionNoteLines({
  firstTouch,
  pagePath,
  referrer,
}: Pick<ApplyAttributionInput, "firstTouch" | "pagePath" | "referrer">): string[] {
  const normalizedPath = normalizeLandingPath(pagePath);
  const normalizedReferrer = clean(referrer);
  const sanitizedFirstTouch = sanitizeFirstTouch(firstTouch);

  const lines: string[] = [];

  if (normalizedPath) {
    lines.push(`Landing path: ${normalizedPath}`);
  }
  if (normalizedReferrer) {
    lines.push(`Referrer URL: ${normalizedReferrer}`);
  }
  if (sanitizedFirstTouch?.utm_source) {
    lines.push(`UTM source: ${sanitizedFirstTouch.utm_source}`);
  }
  if (sanitizedFirstTouch?.utm_medium) {
    lines.push(`UTM medium: ${sanitizedFirstTouch.utm_medium}`);
  }
  if (sanitizedFirstTouch?.utm_campaign) {
    lines.push(`UTM campaign: ${sanitizedFirstTouch.utm_campaign}`);
  }
  if (sanitizedFirstTouch?.utm_content) {
    lines.push(`UTM content: ${sanitizedFirstTouch.utm_content}`);
  }
  if (sanitizedFirstTouch?.utm_term) {
    lines.push(`UTM term: ${sanitizedFirstTouch.utm_term}`);
  }
  if (sanitizedFirstTouch?.fbc) {
    lines.push(`Meta click ID: ${sanitizedFirstTouch.fbc}`);
  }
  if (sanitizedFirstTouch?.captured_at) {
    lines.push(`First touch captured at: ${sanitizedFirstTouch.captured_at}`);
  }

  return lines.length ? ["Attribution:", ...lines] : [];
}

export function buildLeadNotes(
  noteParts: string[],
  input: Pick<ApplyAttributionInput, "firstTouch" | "pagePath" | "referrer">
): string | null {
  const attributionLines = buildAttributionNoteLines(input);
  const lines = noteParts.filter(Boolean);

  if (attributionLines.length) {
    if (lines.length) {
      lines.push("");
    }
    lines.push(...attributionLines);
  }

  return lines.length ? lines.join("\n") : null;
}
