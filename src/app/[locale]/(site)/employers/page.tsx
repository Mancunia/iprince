import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { LeadForm } from "@/features/leads/LeadForm";
import { listActiveProfessions } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Card } from "@/ui/Card";
import { Icon } from "@/ui/Icon";

const BENEFITS = ["selection", "process", "support"] as const;

export default async function EmployersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, professions] = await Promise.all([getTranslations("employers"), listActiveProfessions()]);

  return (
    <section className="bg-accent-100/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-20">
        <div className="grid content-start gap-5">
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <ul className="benefit-list pt-2">
            {BENEFITS.map((b) => (
              <li key={b}>
                <Icon name="circle-check" />
                {t(`benefits.${b}`)}
              </li>
            ))}
          </ul>
        </div>
        <Card className="gap-6 p-6 shadow-raised md:p-10">
          <h2 className="text-xl">{t("formTitle")}</h2>
          <LeadForm professions={professions.map((p) => ({ id: p.id, name: localized(p.name, locale) }))} />
        </Card>
      </div>
    </section>
  );
}
