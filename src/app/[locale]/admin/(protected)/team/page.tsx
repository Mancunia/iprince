import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { InviteForm } from "@/features/team/InviteForm";
import { listTeam } from "@/features/team/queries";
import { RemoveMemberForm } from "@/features/team/RemoveMemberForm";
import { canRemove } from "@/features/team/team";
import { Avatar } from "@/ui/Avatar";
import { Card } from "@/ui/Card";
import { Status } from "@/ui/Status";

export default async function TeamPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const owner = await requireOwner(locale);
  const [t, members] = await Promise.all([getTranslations("admin.team"), listTeam()]);

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <Card className="card-flush">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("name")}</th>
                <th scope="col">{t("email")}</th>
                <th scope="col">{t("role")}</th>
                <th scope="col">{t("status")}</th>
                <th scope="col" className="actions"><span className="sr-only">{t("remove")}</span></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId}>
                  <td>
                    <div className="name-cell">
                      <Avatar name={m.displayName} />
                      <span className="cell-primary">{m.displayName}</span>
                    </div>
                  </td>
                  <td>{m.email}</td>
                  <td>{t(`roles.${m.role}`)}</td>
                  <td><Status tone={m.status === "active" ? "ok" : "review"}>{t(`statuses.${m.status}`)}</Status></td>
                  <td className="actions">{canRemove(m, owner.userId) ? <RemoveMemberForm userId={m.userId} locale={locale} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="max-w-2xl gap-5">
        <h2 className="card-title">{t("invite")}</h2>
        <InviteForm locale={locale} />
      </Card>
    </>
  );
}
