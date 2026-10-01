/** Marker the legal drafts use for every client-specific fact. Production must not launch while one remains. */
export const PLACEHOLDER = "[PLATZHALTER";

export function hasPlaceholder(text: string): boolean {
  return text.includes(PLACEHOLDER);
}

const LEGAL_KEYS = ["legal.imprint", "legal.privacy"] as const;

/** Launch blockers in the legal rows: a missing row or empty German body, or a placeholder in either language. */
export function legalProblems(rows: { key: string; value: unknown }[]): string[] {
  const problems: string[] = [];
  for (const key of LEGAL_KEYS) {
    const value = rows.find((row) => row.key === key)?.value as { body?: { de?: unknown; en?: unknown } } | undefined;
    const de = typeof value?.body?.de === "string" ? value.body.de : "";
    const en = typeof value?.body?.en === "string" ? value.body.en : "";
    if (!de.trim()) {
      problems.push(`${key}: missing`);
      continue;
    }
    if (hasPlaceholder(de)) problems.push(`${key}: placeholder in de`);
    if (hasPlaceholder(en)) problems.push(`${key}: placeholder in en`);
  }
  return problems;
}
