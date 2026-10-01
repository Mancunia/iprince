"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { removeEditor } from "./actions";

export function RemoveMemberForm({ userId, locale }: { userId: string; locale: Locale }) {
  const t = useTranslations("admin.team");
  const [state, action, pending] = useActionState(removeEditor, null);

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="locale" value={locale} />
      <Button
        type="submit"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm(t("confirmRemove"))) event.preventDefault();
        }}
      >
        {t("remove")}
      </Button>
      {state && !state.ok ? <Text role="alert" tone="danger" size="sm">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
    </form>
  );
}
