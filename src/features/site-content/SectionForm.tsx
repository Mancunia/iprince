"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { saveSiteContent } from "./admin-actions";
import { getAt, type FieldGroup, type FieldSpec } from "./sections";

type Props = { locale: Locale; section: string; groups: FieldGroup[]; values: unknown };

export function SectionForm({ locale, section, groups, values }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(saveSiteContent, null);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errorsFor = (name: string) => fieldErrors[name]?.map((code) => t(`fieldErrors.${code}`));

  const input = (spec: FieldSpec, name: string, label: string, required: boolean) => {
    const id = `content-${name.replaceAll(".", "-")}`;
    const props = { id, name, defaultValue: String(getAt(values, name) ?? ""), required, invalid: Boolean(fieldErrors[name]) };
    return (
      <Field key={name} id={id} label={label} required={required} errors={errorsFor(name)}>
        {spec.long ? <Textarea rows={4} {...props} /> : <Input {...props} />}
      </Field>
    );
  };

  return (
    <form
      onSubmit={(event) => {
        // Submit manually: a form `action` would reset the inputs after a failed save.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Stack gap="lg">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="section" value={section} />
        {groups.map((group, index) => (
          <fieldset key={group.group ?? index} className="grid gap-4">
            {group.group ? <legend className="card-title mb-2">{t(`content.groups.${group.group}`)}</legend> : null}
            {group.fields.map((spec) => {
              const label = t(`content.fields.${spec.label}`);
              if (!spec.localized) return input(spec, spec.path, label, spec.path === "whatsapp");
              return (
                <div key={spec.path} className="grid gap-4 md:grid-cols-2">
                  {input(spec, `${spec.path}.de`, `${label} (DE)`, true)}
                  {input(spec, `${spec.path}.en`, `${label} (EN)`, false)}
                </div>
              );
            })}
          </fieldset>
        ))}
        <Text tone="muted" size="sm">{t("content.englishHelp")}</Text>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
