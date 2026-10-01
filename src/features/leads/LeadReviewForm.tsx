"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { updateLead } from "./admin-actions";
import { LEAD_STATUSES, type LeadStatus } from "./schema";

type Props = { id: string; locale: Locale; status: LeadStatus; adminNotes: string };

export function LeadReviewForm({ id, locale, status, adminNotes }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(updateLead, null);

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <Field id="lead-status" label={t("status")}>
          <Select id="lead-status" name="status" defaultValue={status}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.leadStatuses.${s}`)}</option>)}
          </Select>
        </Field>
        <Field id="lead-notes" label={t("notes")}>
          <Textarea id="lead-notes" name="adminNotes" defaultValue={adminNotes} maxLength={5000} />
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`inbox.errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
