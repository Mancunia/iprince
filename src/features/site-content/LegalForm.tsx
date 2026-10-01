"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Textarea } from "@/ui/inputs";
import { Markdown } from "@/ui/Markdown";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { saveSiteContent } from "./admin-actions";
import { hasPlaceholder } from "./legal-check";

type Lang = "de" | "en";
type Props = { locale: Locale; section: string; body: Record<Lang, string> };

/** Both languages stay mounted (hidden, not removed) so a save always sends de and en. */
export function LegalForm({ locale, section, body }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(saveSiteContent, null);
  const [lang, setLang] = useState<Lang>("de");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [text, setText] = useState(body);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="section" value={section} />
        {hasPlaceholder(text.de) || hasPlaceholder(text.en) ? (
          <p className="notice notice-error"><Icon name="circle-alert" />{t("content.placeholderWarning")}</p>
        ) : null}
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("content.sections." + section)}>
          {(["de", "en"] as const).map((l) => (
            <Button key={l} variant={lang === l ? "primary" : "secondary"} size="sm" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {t(l === "de" ? "content.german" : "content.english")}
            </Button>
          ))}
          <span className="mx-2 border-l border-hairline" aria-hidden="true" />
          {(["write", "preview"] as const).map((m) => (
            <Button key={m} variant={mode === m ? "primary" : "secondary"} size="sm" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {t(`content.${m}`)}
            </Button>
          ))}
        </div>
        {(["de", "en"] as const).map((l) => (
          <div key={l} hidden={lang !== l || mode !== "write"}>
            <Field
              id={`legal-body-${l}`}
              label={`${t("content.fields.body")} (${l.toUpperCase()})`}
              required={l === "de"}
              help={t("content.markdownHelp")}
              errors={fieldErrors[`body.${l}`]?.map((code) => t(`fieldErrors.${code}`))}
            >
              <Textarea
                id={`legal-body-${l}`}
                name={`body.${l}`}
                rows={24}
                className="font-mono text-sm"
                value={text[l]}
                onChange={(event) => setText({ ...text, [l]: event.target.value })}
                invalid={Boolean(fieldErrors[`body.${l}`])}
              />
            </Field>
          </div>
        ))}
        {mode === "preview" ? <Card className="p-6"><Markdown>{text[lang] || text.de}</Markdown></Card> : null}
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
