"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { deleteLead, deleteMessage } from "./admin-actions";

export function DeleteEntryForm({ kind, id, locale }: { kind: "lead" | "message"; id: string; locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(kind === "lead" ? deleteLead : deleteMessage, null);

  return (
    <form action={action} className="border-t border-hairline pt-6">
      <Stack gap="sm">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`inbox.errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button
          type="submit"
          variant="danger"
          disabled={pending}
          onClick={(event) => {
            if (!window.confirm(t("inbox.confirmDelete"))) event.preventDefault();
          }}
        >
          {t("inbox.delete")}
        </Button>
      </Stack>
    </form>
  );
}
