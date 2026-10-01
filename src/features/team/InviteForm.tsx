"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { inviteEditor } from "./actions";

export function InviteForm({ locale }: { locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(inviteEditor, null);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errorsFor = (name: string) => fieldErrors[name]?.map((code) => t(`fieldErrors.${code}`));

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        <Field id="invite-email" label={t("team.email")} required errors={errorsFor("email")}>
          <Input id="invite-email" name="email" type="email" autoComplete="off" required invalid={Boolean(fieldErrors.email)} />
        </Field>
        <Field id="invite-name" label={t("team.displayName")} required errors={errorsFor("displayName")}>
          <Input id="invite-name" name="displayName" required invalid={Boolean(fieldErrors.displayName)} />
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("team.invited")}</Text> : null}
        {state && !state.ok && !state.fieldErrors ? <Text role="alert" tone="danger">{t(`team.errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("team.sendInvite")}</Button>
      </Stack>
    </form>
  );
}
