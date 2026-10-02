import { getFormatter, getTranslations } from "next-intl/server";
import { cn } from "@/ui/cn";
import { readingMinutes } from "./reading-time";

/** "1. Oktober 2026 · 4 Min. Lesezeit · Von iPrince": shared by cards, the hero and the article. */
export async function PostMeta({ publishedAt, body, author, className }: { publishedAt: string; body: string; author?: string; className?: string }) {
  const [t, format] = await Promise.all([getTranslations("blog"), getFormatter()]);
  return (
    <span className={cn("text-sm text-fg-muted", className)}>
      <time dateTime={publishedAt}>{format.dateTime(new Date(publishedAt), { dateStyle: "long", timeZone: "Europe/Berlin" })}</time>
      {" · "}
      {t("minutes", { count: readingMinutes(body) })}
      {author ? <> · {t("by", { author })}</> : null}
    </span>
  );
}
