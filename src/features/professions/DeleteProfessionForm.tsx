"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { deleteProfession } from "./admin-actions";

export function DeleteProfessionForm({ id, locale }: { id: string; locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(deleteProfession, null);

  return (
    <form action={action}>
      <Stack gap="sm">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button
          type="submit"
          variant="secondary"
          disabled={pending}
          onClick={(event) => {
            if (!window.confirm(t("professions.confirmDelete"))) event.preventDefault();
          }}
        >
          {t("professions.delete")}
        </Button>
      </Stack>
    </form>
  );
}
