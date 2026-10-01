import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Markdown } from "@/ui/Markdown";
import type { LegalKey } from "./content";
import { getSiteContent } from "./queries";

/** Impressum / privacy policy. Without an English text, /en shows the German one, marked as German. */
export async function LegalArticle({ contentKey, locale, title }: { contentKey: LegalKey; locale: Locale; title: string }) {
  const [t, content] = await Promise.all([getTranslations("site"), getSiteContent()]);
  const { de, en } = content[contentKey].body;
  const germanFallback = locale === "en" && !en.trim();

  return (
    <article className="container-page grid gap-8 py-14 md:py-20">
      <h1>{title}</h1>
      {germanFallback ? <p className="notice notice-info">{t("germanOnly")}</p> : null}
      <div lang={germanFallback ? "de" : undefined}>
        <Markdown>{locale === "de" || germanFallback ? de : en}</Markdown>
      </div>
    </article>
  );
}
