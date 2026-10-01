"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { updateMessage } from "./admin-actions";
import { MESSAGE_STATUSES, type MessageStatus } from "./schema";

type Props = { id: string; locale: Locale; status: MessageStatus };

export function MessageStatusForm({ id, locale, status }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(updateMessage, null);

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <Field id="message-status" label={t("status")}>
          <Select id="message-status" name="status" defaultValue={status}>
            {MESSAGE_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.messageStatuses.${s}`)}</option>)}
          </Select>
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`inbox.errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
