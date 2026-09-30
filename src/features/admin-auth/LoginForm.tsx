"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { signIn } from "./actions";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(signIn, null);
  const error = state && !state.ok ? state.formError : undefined;

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        <Field id="admin-email" label={t("email")} required>
          <Input id="admin-email" name="email" type="email" autoComplete="username" required />
        </Field>
        <Field id="admin-password" label={t("password")} required>
          <Input id="admin-password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {error ? <Text role="alert" tone="danger">{t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.server_error")}</Text> : null}
        <Button type="submit" disabled={pending}>{t("signIn")}</Button>
      </Stack>
    </form>
  );
}
