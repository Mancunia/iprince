"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { setPassword } from "./actions";
import { MIN_PASSWORD_LENGTH } from "./password";

export function SetPasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(setPassword, null);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errorsFor = (name: string) => fieldErrors[name]?.map((code) => t(`fieldErrors.${code}`));

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        <Field id="new-password" label={t("setPassword.password")} help={t("setPassword.help")} required errors={errorsFor("password")}>
          <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
        </Field>
        <Field id="confirm-password" label={t("setPassword.confirm")} required errors={errorsFor("confirm")}>
          <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required />
        </Field>
        {state && !state.ok && !state.fieldErrors ? <Text role="alert" tone="danger">{t("errors.server_error")}</Text> : null}
        <Button type="submit" disabled={pending}>{t("setPassword.submit")}</Button>
      </Stack>
    </form>
  );
}
