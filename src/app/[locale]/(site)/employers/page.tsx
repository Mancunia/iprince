import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { LeadForm } from "@/features/leads/LeadForm";
import { listActiveProfessions } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Blueprint } from "@/ui/Blueprint";
import { Icon } from "@/ui/Icon";

const BENEFITS = ["selection", "process", "support"] as const;

export default async function EmployersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, professions] = await Promise.all([getTranslations("employers"), listActiveProfessions()]);

  return (
    <div className="door-employer bg-surface text-fg">
      <div className="container-page grid gap-12 py-12 pb-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-6">
          <p className="kicker kicker-rule">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <ul className="door-list">
            {BENEFITS.map((b) => (
              <li key={b}>
                <Icon name="check" />
                {t(`benefits.${b}`)}
              </li>
            ))}
          </ul>
        </div>
        <Blueprint className="form-section grid gap-6">
          <h2 className="text-xl">{t("formTitle")}</h2>
          <LeadForm professions={professions.map((p) => ({ id: p.id, name: localized(p.name, locale) }))} />
        </Blueprint>
      </div>
    </div>
  );
}
