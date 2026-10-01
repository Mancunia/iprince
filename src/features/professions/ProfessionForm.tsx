"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Input, Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import type { ProfessionInput } from "./admin";
import { createProfession, updateProfession } from "./admin-actions";

type Props = { locale: Locale; icons: string[]; values: ProfessionInput } & ({ mode: "create" } | { mode: "edit"; id: string });

export function ProfessionForm(props: Props) {
  const { locale, icons, values } = props;
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(props.mode === "create" ? createProfession : updateProfession, null);
  const [icon, setIcon] = useState(values.icon);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errorsFor = (name: string) => fieldErrors[name]?.map((code) => t(`fieldErrors.${code}`));

  return (
    <form
      onSubmit={(event) => {
        // Submit manually: a form `action` would reset the inputs after a failed save.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        {props.mode === "edit" ? <input type="hidden" name="id" value={props.id} /> : null}
        <Field id="profession-slug" label={t("professions.slug")} help={t("professions.slugHelp")} required errors={errorsFor("slug")}>
          <Input id="profession-slug" name="slug" defaultValue={values.slug} required invalid={Boolean(fieldErrors.slug)} />
        </Field>
        <Field id="profession-name-de" label={`${t("professions.name")} (DE)`} required errors={errorsFor("nameDe")}>
          <Input id="profession-name-de" name="nameDe" defaultValue={values.nameDe} required invalid={Boolean(fieldErrors.nameDe)} />
        </Field>
        <Field id="profession-name-en" label={`${t("professions.name")} (EN)`} errors={errorsFor("nameEn")}>
          <Input id="profession-name-en" name="nameEn" defaultValue={values.nameEn} />
        </Field>
        <Field id="profession-summary-de" label={`${t("professions.summary")} (DE)`} errors={errorsFor("summaryDe")}>
          <Textarea id="profession-summary-de" name="summaryDe" defaultValue={values.summaryDe} />
        </Field>
        <Field id="profession-summary-en" label={`${t("professions.summary")} (EN)`} errors={errorsFor("summaryEn")}>
          <Textarea id="profession-summary-en" name="summaryEn" defaultValue={values.summaryEn} />
        </Field>
        <Field id="profession-icon" label={t("professions.icon")} errors={errorsFor("icon")}>
          <Stack direction="row" gap="sm">
            <Select id="profession-icon" name="icon" value={icon} onChange={(event) => setIcon(event.target.value)}>
              {icons.map((name) => <option key={name} value={name}>{name}</option>)}
            </Select>
            <Icon name={icon} size={24} />
          </Stack>
        </Field>
        <Field id="profession-sort" label={t("professions.sortOrder")} errors={errorsFor("sortOrder")}>
          <Input id="profession-sort" name="sortOrder" type="number" min={0} step={1} defaultValue={values.sortOrder} />
        </Field>
        <Field id="profession-positions" label={t("professions.openPositions")} errors={errorsFor("openPositions")}>
          <Input id="profession-positions" name="openPositions" type="number" min={0} step={1} defaultValue={values.openPositions} />
        </Field>
        {props.mode === "edit" ? (
          <Field id="profession-active" label={t("professions.active")} errors={errorsFor("isActive")}>
            <Input id="profession-active" name="isActive" type="checkbox" defaultChecked={values.isActive} />
          </Field>
        ) : null}
        <Field id="profession-featured" label={t("professions.featured")}>
          <Input id="profession-featured" name="isFeatured" type="checkbox" defaultChecked={values.isFeatured} />
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("professions.saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{props.mode === "create" ? t("professions.create") : t("professions.save")}</Button>
      </Stack>
    </form>
  );
}
