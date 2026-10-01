"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { deletePost } from "./admin-actions";

/** A plain button (not a form): it sits inside the post <form>, and forms cannot nest. */
export function DeletePostButton({ id, locale }: { id: string; locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(deletePost, null);

  return (
    <Stack gap="sm">
      {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("blog.confirmDelete"))) return;
          const data = new FormData();
          data.set("id", id);
          data.set("locale", locale);
          startTransition(() => action(data));
        }}
      >
        {t("blog.delete")}
      </Button>
    </Stack>
  );
}
