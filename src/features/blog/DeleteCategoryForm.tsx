"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { deleteCategory } from "./admin-actions";

export function DeleteCategoryForm({ id, locale, postCount }: { id: string; locale: Locale; postCount: number }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(deleteCategory, null);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t("blog.confirmDeleteCategory", { count: postCount }))) event.preventDefault();
      }}
    >
      <Stack gap="sm">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" variant="ghost" size="sm" disabled={pending} className="max-w-max">{t("blog.deleteCategory")}</Button>
      </Stack>
    </form>
  );
}
