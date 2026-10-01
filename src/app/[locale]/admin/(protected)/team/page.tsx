import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { InviteForm } from "@/features/team/InviteForm";
import { listTeam } from "@/features/team/queries";
import { RemoveMemberForm } from "@/features/team/RemoveMemberForm";
import { canRemove } from "@/features/team/team";
import { Stack } from "@/ui/Stack";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

export default async function TeamPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const owner = await requireOwner(locale);
  const [t, members] = await Promise.all([getTranslations("admin.team"), listTeam()]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("title")}</Text>
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
                <td className="cell-primary">{m.displayName}</td>
                <td>{m.email}</td>
                <td>{t(`roles.${m.role}`)}</td>
                <td><Status tone={m.status === "active" ? "ok" : "review"}>{t(`statuses.${m.status}`)}</Status></td>
                <td className="actions">{canRemove(m, owner.userId) ? <RemoveMemberForm userId={m.userId} locale={locale} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Text as="h2" size="lg">{t("invite")}</Text>
      <InviteForm locale={locale} />
    </Stack>
  );
}
