"use client";

import { useTranslations } from "next-intl";
import type { LocalizedText } from "@/lib/i18n/localized";
import { Field } from "@/ui/Field";
import { Input, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import type { BuilderErrors } from "./model";

type Props = {
  id: string;
  label: string;
  value: LocalizedText | undefined;
  onChange: (value: LocalizedText) => void;
  required?: boolean;
  multiline?: boolean;
  /** Errors relative to this text, keyed "de" / "en". */
  errors?: BuilderErrors;
};

export function LocalizedInputs({ id, label, value, onChange, required, multiline, errors = {} }: Props) {
  const t = useTranslations("admin.forms");
  const current = value ?? { de: "", en: "" };

  return (
    <Stack direction="row" gap="sm">
      {(["de", "en"] as const).map((lang) => {
        const inputId = `${id}-${lang}`;
        const invalid = Boolean(errors[lang]);
        const change = (text: string) => onChange({ ...current, [lang]: text });
        return (
          <Field key={lang} id={inputId} label={`${label} (${lang.toUpperCase()})`} required={required && lang === "de"} errors={invalid ? [t("checkThis")] : undefined}>
            {multiline ? (
              <Textarea id={inputId} value={current[lang]} invalid={invalid} onChange={(e) => change(e.target.value)} />
            ) : (
              <Input id={inputId} value={current[lang]} invalid={invalid} onChange={(e) => change(e.target.value)} />
            )}
          </Field>
        );
      })}
    </Stack>
  );
}
