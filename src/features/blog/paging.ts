export const POSTS_PER_PAGE = 9;

/** ?page= as a page number: missing means 1; anything but one plain positive integer is null (404). */
export function parsePage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  if (typeof raw !== "string" || !/^[1-9]\d{0,4}$/.test(raw)) return null;
  return Number(raw);
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

/** Inclusive row range for Supabase `.range(from, to)`. */
export function pageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * POSTS_PER_PAGE;
  return { from, to: from + POSTS_PER_PAGE - 1 };
}
