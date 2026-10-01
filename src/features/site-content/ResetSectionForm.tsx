"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { resetSiteContent } from "./admin-actions";

export function ResetSectionForm({ locale, section }: { locale: Locale; section: string }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(resetSiteContent, null);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t("content.resetConfirm"))) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="section" value={section} />
      {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
      <Button type="submit" variant="secondary" disabled={pending}>{t("content.reset")}</Button>
    </form>
  );
}
