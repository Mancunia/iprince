"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { updateChatProvider } from "./actions";
import { chatProviders, type ChatProvider } from "./settings";

export function ChatSettingsForm({ current, locale }: { current: ChatProvider; locale: Locale }) {
  const t = useTranslations("admin.settings");
  const [state, action, pending] = useActionState(updateChatProvider, null);

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        <fieldset className="field">
          <legend className="label">{t("chatProvider")}</legend>
          <p className="hint">{t("chatHelp")}</p>
          {chatProviders.map((provider) => (
            <label key={provider} className="radio">
              <Input type="radio" name="chatProvider" value={provider} defaultChecked={provider === current} required />
              <span>{t(`providers.${provider}`)}</span>
            </label>
          ))}
        </fieldset>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
