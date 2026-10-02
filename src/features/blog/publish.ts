export const POST_STATES = ["draft", "scheduled", "live"] as const;
export type PostState = (typeof POST_STATES)[number];
export type PostStatus = "draft" | "published";

const INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const berlinParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Berlin",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Minutes Berlin is ahead of UTC at this instant (60 in winter, 120 in summer). */
function berlinOffsetMinutes(utcMs: number): number {
  const parts = Object.fromEntries(berlinParts.formatToParts(utcMs).map((part) => [part.type, Number(part.value)]));
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((wall - utcMs) / 60_000);
}

/** The post's lifecycle as visitors see it: a published post with a future date is scheduled. */
export function postState(status: PostStatus, publishedAt: string | null, now: Date): PostState {
  if (status === "draft") return "draft";
  return publishedAt !== null && Date.parse(publishedAt) > now.getTime() ? "scheduled" : "live";
}

/** `<input type="datetime-local">` value in Berlin time → ISO UTC; null unless it is a real date-time. */
export function berlinInputToUtc(value: string): string | null {
  const match = INPUT.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(wall);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59) return null;
  // The offset depends on the instant itself (summer time), so refine once from a first guess.
  const guess = wall - berlinOffsetMinutes(wall) * 60_000;
  return new Date(wall - berlinOffsetMinutes(guess) * 60_000).toISOString();
}

/** ISO UTC → `datetime-local` value in Berlin time; "" when there is no usable date. */
export function utcToBerlinInput(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Date(ms + berlinOffsetMinutes(ms) * 60_000).toISOString().slice(0, 16);
}

/** Stored published_at: the entered date, else now when publishing, else none (an undated draft). */
export function resolvePublishedAt(status: PostStatus, input: string, now: Date): string | null {
  if (input) return berlinInputToUtc(input);
  return status === "published" ? now.toISOString() : null;
}
