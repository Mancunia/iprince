import * as stylex from "@stylexjs/stylex";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { requireOwner } from "@/features/admin-auth/session";
import { InviteForm } from "@/features/team/InviteForm";
import { listTeam } from "@/features/team/queries";
import { RemoveMemberForm } from "@/features/team/RemoveMemberForm";
import { canRemove } from "@/features/team/team";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

const styles = stylex.create({
  visuallyHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
  },
});

export default async function TeamPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const owner = await requireOwner(locale);
  const [t, members] = await Promise.all([getTranslations("admin.team"), listTeam()]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("title")}</Text>
      <table>
        <thead>
          <tr>
            <th scope="col">{t("name")}</th>
            <th scope="col">{t("email")}</th>
            <th scope="col">{t("role")}</th>
            <th scope="col">{t("status")}</th>
            <th scope="col"><span {...stylex.props(styles.visuallyHidden)}>{t("remove")}</span></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.userId}>
              <td>{m.displayName}</td>
              <td>{m.email}</td>
              <td>{t(`roles.${m.role}`)}</td>
              <td>{t(`statuses.${m.status}`)}</td>
              <td>{canRemove(m, owner.userId) ? <RemoveMemberForm userId={m.userId} locale={locale} /> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Text as="h2" size="lg">{t("invite")}</Text>
      <InviteForm locale={locale} />
    </Stack>
  );
}
