"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { updateApplication } from "./admin-actions";
import { APPLICATION_STATUSES, type ApplicationStatus } from "./review";

type Props = { id: string; locale: Locale; status: ApplicationStatus; adminNotes: string };

export function ReviewForm({ id, locale, status, adminNotes }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(updateApplication, null);

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <Field id="review-status" label={t("status")}>
          <Select id="review-status" name="status" defaultValue={status}>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </Select>
        </Field>
        <Field id="review-notes" label={t("notes")}>
          <Textarea id="review-notes" name="adminNotes" defaultValue={adminNotes} />
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
