import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { listActiveProfessions } from "@/features/professions/queries";
import { WHATSAPP_URL } from "@/features/site/contact";
import { localized } from "@/lib/i18n/localized";
import { Blueprint } from "@/ui/Blueprint";
import { Icon } from "@/ui/Icon";

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

  return (
    <>
      <section className="section">
        <div className="container-page grid items-center gap-12 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="grid gap-6">
            <p className="kicker kicker-rule">{t("kicker")}</p>
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
          </div>
          <Blueprint>
            <div className="cells grid-cols-2 border-0">
              <div className="stat">
                <span className="stat-value">{format.number(openPositions)}</span>
                <span className="stat-label">{t("statPositions")}</span>
              </div>
              <div className="stat">
                <span className="stat-value">{format.number(professions.length)}</span>
                <span className="stat-label">{t("statProfessions")}</span>
              </div>
              <div className="stat col-span-2 flex items-center gap-3">
                <Icon name="badge-check" size={28} className="text-fg-accent" />
                <span className="font-display text-xl font-semibold">{t("statFree")}</span>
              </div>
            </div>
          </Blueprint>
        </div>
      </section>

      <section id="berufe" className="section scroll-mt-16 border-t border-hairline">
        <div className="container-page">
          <div className="section-head">
            <p className="kicker kicker-rule">{t("professionsKicker")}</p>
            <h2>{t("professionsTitle")}</h2>
            <p className="lead">{t("professionsLead")}</p>
          </div>
          {professions.length === 0 ? (
            <p className="notice notice-info">
              <Icon name="info" />
              {tSite("noProfessions")}
            </p>
          ) : (
            <ul className="cells grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
              {professions.map((p) => (
                <li key={p.slug} className="flex">
                  <Link href={`/apply/${p.slug}`} className="card w-full">
                    <Icon name={p.icon} size={36} className="text-fg-accent" />
                    <span className="card-title">{localized(p.name, locale)}</span>
                    <span className="card-body">{tSite("openPositions", { count: p.openPositions })}</span>
                    <span className="inline-flex items-center gap-2 font-display text-lg font-semibold text-link">
                      {tSite("cta")}
                      <Icon name="arrow-right" size={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="door-split">
          <div className="door">
            <p className="kicker kicker-rule">{t("doors.candidateKicker")}</p>
            <h2>{t("doors.candidateTitle")}</h2>
            <p className="text-fg-muted">{t("doors.candidateText")}</p>
            <a href="#berufe" className="btn btn-primary max-w-max">
              {t("doors.candidateCta")}
              <Icon name="arrow-right" />
            </a>
          </div>
          <div className="door door-employer bg-surface text-fg">
            <p className="kicker kicker-rule">{t("doors.employerKicker")}</p>
            <h2>{t("doors.employerTitle")}</h2>
            <p className="text-fg-muted">{t("doors.employerText")}</p>
            <Link href="/employers" className="btn btn-primary max-w-max">
              {t("doors.employerCta")}
              <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>

      <section id="ablauf" className="section scroll-mt-16 bg-surface-tint">
        <div className="container-page">
          <div className="section-head">
            <p className="kicker kicker-rule">{t("stepsKicker")}</p>
            <h2>{t("stepsTitle")}</h2>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step}>
                <span className="steps-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-xl">{t(`steps.${step}.title`)}</h3>
                <p className="text-fg-muted">{t(`steps.${step}.text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
