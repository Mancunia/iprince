import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { listActiveProfessions } from "@/features/professions/queries";
import { WHATSAPP_URL } from "@/features/site/contact";
import { Photo } from "@/features/site/Photo";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";

const TRUST = [
  { key: "free", icon: "badge-check" },
  { key: "advisor", icon: "heart-handshake" },
  { key: "languages", icon: "languages" },
] as const;
const FEATURES = [
  { key: "match", slot: "feature-match" },
  { key: "advisors", slot: "feature-advisors" },
] as const;
const STEPS = ["choose", "apply", "contact"] as const;

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tSite, format, professions] = await Promise.all([
    getTranslations("home"),
    getTranslations("site"),
    getFormatter(),
    listActiveProfessions(),
  ]);
  const openPositions = professions.reduce((sum, p) => sum + p.openPositions, 0);
  const stats = [
    { icon: "briefcase", value: format.number(openPositions), label: t("statPositions") },
    { icon: "layout-grid", value: format.number(professions.length), label: t("statProfessions") },
    { icon: "badge-check", value: t("statFreeValue"), label: t("statFree") },
  ];

  return (
    <>
      <section className="pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="container-page grid items-center gap-12 md:grid-cols-2">
          <div className="grid gap-6">
            <p className="eyebrow">{t("kicker")}</p>
            <h1>{t("title")}</h1>
            <p className="lead">{t("lead")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#berufe" className="btn btn-primary btn-lg">
                {tSite("cta")}
                <Icon name="arrow-right" />
              </a>
              <a href={WHATSAPP_URL} className="btn btn-lg" target="_blank" rel="noopener noreferrer">
                <Icon name="message-circle" />
                {t("ctaWhatsapp")}
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm text-fg-muted">
              {TRUST.map(({ key, icon }) => (
                <li key={key} className="inline-flex items-center gap-2">
                  <Icon name={icon} size={16} className="text-gold-600" />
                  {t(`trust.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <Photo slot="hero" alt={t("heroAlt")} className="aspect-[4/5] md:aspect-[5/6]" priority />
            {openPositions > 0 ? (
              <div className="float-badge -left-4 top-10">
                <span className="icon-chip"><Icon name="briefcase" size={16} /></span>
                <span><strong>{tSite("openPositions", { count: openPositions })}</strong>{t("badgeLive")}</span>
              </div>
            ) : null}
            <div className="float-badge -right-4 bottom-10">
              <span className="icon-chip icon-chip-navy"><Icon name="badge-check" size={16} /></span>
              <span><strong>{t("statFree")}</strong>{t("badgeFreeText")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page relative z-10 grid gap-4 sm:grid-cols-3 md:-mt-8">
        {stats.map((s) => (
          <Card key={s.label} className="stat">
            <span className="icon-chip"><Icon name={s.icon} /></span>
            <span>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </span>
          </Card>
        ))}
      </section>

      <section className="section">
        <div className="container-page grid gap-20 md:gap-28">
          {FEATURES.map((f, i) => (
            <div key={f.key} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className={cn("relative", i % 2 === 1 && "md:order-2")}>
                <Photo slot={f.slot} alt={t(`features.${f.key}.alt`)} className="aspect-[4/3]" />
                {f.key === "advisors" ? (
                  <div className="float-badge -bottom-6 right-6">
                    <span className="icon-chip"><Icon name="heart-handshake" size={16} /></span>
                    <span><strong>{t("features.advisors.badgeTitle")}</strong>{t("features.advisors.badgeText")}</span>
                  </div>
                ) : null}
              </div>
              <div className="grid content-center gap-5">
                <p className="eyebrow">{t(`features.${f.key}.eyebrow`)}</p>
                <h2>{t(`features.${f.key}.title`)}</h2>
                <p className="lead">{t(`features.${f.key}.text`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="berufe" className="section section-tint scroll-mt-16">
        <div className="container-page">
          <div className="section-head">
            <p className="eyebrow">{t("professionsKicker")}</p>
            <h2>{t("professionsTitle")}</h2>
            <p className="lead">{t("professionsLead")}</p>
          </div>
          {professions.length === 0 ? (
            <p className="notice notice-info">
              <Icon name="info" />
              {tSite("noProfessions")}
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {professions.map((p) => (
                <li key={p.slug} className="flex">
                  <Link href={`/apply/${p.slug}`} className="card w-full gap-4">
                    <span className="flex items-start justify-between gap-3">
                      <span className="icon-chip icon-chip-navy icon-chip-lg"><Icon name={p.icon} size={28} /></span>
                      <span className="tag tag-gold">{tSite("openPositions", { count: p.openPositions })}</span>
                    </span>
                    <span className="card-title">{localized(p.name, locale)}</span>
                    <span className="mt-auto flex items-center justify-between gap-3 border-t border-hairline pt-4">
                      <span className="text-sm text-fg-muted">{t("trust.free")}</span>
                      <span className="btn btn-primary btn-sm">{tSite("apply")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="ablauf" className="section scroll-mt-16">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="section-head">
              <p className="eyebrow">{t("stepsKicker")}</p>
              <h2>{t("stepsTitle")}</h2>
            </div>
            <ol className="timeline">
              {STEPS.map((step, i) => (
                <li key={step}>
                  <span className="timeline-dot" aria-hidden="true">{i + 1}</span>
                  <h3 className="text-xl">{t(`steps.${step}.title`)}</h3>
                  <p className="text-fg-muted">{t(`steps.${step}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
          <Photo slot="steps" alt={t("stepsAlt")} className="hidden aspect-square lg:grid" />
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="cta-banner">
          <Photo slot="employer-banner" alt="" sizes="100vw" />
          <p className="eyebrow">{t("doors.employerKicker")}</p>
          <h2 className="max-w-[20ch]">{t("doors.employerTitle")}</h2>
          <p className="lead">{t("doors.employerText")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/employers" className="btn btn-primary">
              {t("doors.employerCta")}
              <Icon name="arrow-right" />
            </Link>
            <Link href="/contact" className="btn">{t("doors.contactCta")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
