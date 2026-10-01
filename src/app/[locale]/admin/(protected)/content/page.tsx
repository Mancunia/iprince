import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { CONTENT_KEYS, isLegalKey, PHOTO_SLOTS, photoSrc, SECTION_SLUGS, type ContentKey, type SiteContent } from "@/features/site-content/content";
import { hasPlaceholder } from "@/features/site-content/legal-check";
import { getContentMeta, getSiteContent } from "@/features/site-content/queries";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";

/** One line of German text that identifies the section's current content. */
function previewOf(key: ContentKey, content: SiteContent): string {
  switch (key) {
    case "home.hero": return content[key].title.de;
    case "home.features": return content[key].match.title.de;
    case "home.steps": return content[key].title.de;
    case "home.employers": return content[key].title.de;
    case "contact": return content[key].whatsapp;
    case "photos": return "";
    case "legal.imprint":
    case "legal.privacy": return content[key].body.de.replace(/[#*\\[\]]/g, "").slice(0, 120);
  }
}

export default async function ContentPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await requireAdmin(locale);
  const [t, format, content, meta] = await Promise.all([getTranslations("admin.content"), getFormatter(), getSiteContent(), getContentMeta()]);

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <div className="grid gap-4 md:grid-cols-2">
        {CONTENT_KEYS.map((key) => {
          const slug = SECTION_SLUGS[key];
          const legal = isLegalKey(key);
          const canEdit = !legal || admin.role === "owner";
          const placeholders = legal && (hasPlaceholder(content[key].body.de) || hasPlaceholder(content[key].body.en));
          const updated = meta[key];
          return (
            <Card key={key} className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="card-title">{t(`sections.${slug}`)}</h2>
                <span className="flex flex-wrap gap-2">
                  {placeholders ? <span className="tag bg-error-soft text-error">{t("placeholders")}</span> : null}
                  <span className="tag">{updated ? t("edited", { date: format.dateTime(new Date(updated), { dateStyle: "medium" }) }) : t("default")}</span>
                </span>
              </div>
              {key === "photos" ? (
                <div className="flex flex-wrap gap-2">
                  {PHOTO_SLOTS.map((slot) => {
                    const src = photoSrc(content.photos[slot].path);
                    return src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail, no optimisation needed
                      <img key={slot} src={src} alt="" className="size-14 rounded-md object-cover" />
                    ) : (
                      <span key={slot} className="photo-ph size-14 rounded-md" aria-hidden="true" />
                    );
                  })}
                </div>
              ) : (
                <Text tone="muted" className="line-clamp-2">{previewOf(key, content)}</Text>
              )}
              {canEdit ? (
                <Link href={`/admin/content/${slug}`} className="btn btn-sm max-w-max">{t("edit")}</Link>
              ) : (
                <Text tone="muted" size="sm">{t("ownerOnly")}</Text>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
