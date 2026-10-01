"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { locales, type Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import type { FormDefinition } from "../definition";
import { DynamicFields } from "../DynamicFields";

/** Renders a definition the way applicants see it. Not inside a <form>, so it cannot be submitted. */
export function FormPreview({ definition, initialLocale }: { definition: FormDefinition; initialLocale: Locale }) {
  const t = useTranslations("admin.forms");
  const tApply = useTranslations("apply");
  const [locale, setLocale] = useState(initialLocale);

  return (
    <Stack gap="md">
      <Stack direction="row" gap="sm">
        {locales.map((l) => (
          <Button key={l} variant={l === locale ? "primary" : "secondary"} aria-pressed={l === locale} onClick={() => setLocale(l)}>
            {l.toUpperCase()}
          </Button>
        ))}
      </Stack>
      <div role="group" aria-label={t("preview")}>
        <DynamicFields definition={definition} locale={locale} errors={{}} errorText={(code) => code} chooseLabel={tApply("choose")} />
      </div>
    </Stack>
  );
}
