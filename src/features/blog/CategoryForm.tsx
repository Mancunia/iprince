"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input, Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { createCategory, updateCategory } from "./admin-actions";
import { BLOG_CTAS, type CategoryInput } from "./schema";

type Props = { locale: Locale; values: CategoryInput } & ({ mode: "create" } | { mode: "edit"; id: string });

export function CategoryForm(props: Props) {
  const { locale, values } = props;
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(props.mode === "create" ? createCategory : updateCategory, null);
  const form = useRef<HTMLFormElement>(null);
  const prefix = props.mode === "create" ? "category-new" : `category-${props.id}`;
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errorsFor = (name: string) => fieldErrors[name]?.map((code) => t(`fieldErrors.${code}`));

  // A created category appears in the list below; empty the form for the next one.
  useEffect(() => {
    if (props.mode === "create" && state?.ok) form.current?.reset();
  }, [props.mode, state]);

  return (
    <form
      ref={form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Stack gap="md">
        <input type="hidden" name="locale" value={locale} />
        {props.mode === "edit" ? <input type="hidden" name="id" value={props.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${prefix}-name-de`} label={`${t("blog.categoryName")} (DE)`} required errors={errorsFor("nameDe")}>
            <Input id={`${prefix}-name-de`} name="nameDe" defaultValue={values.nameDe} invalid={Boolean(fieldErrors.nameDe)} />
          </Field>
          <Field id={`${prefix}-name-en`} label={`${t("blog.categoryName")} (EN)`} errors={errorsFor("nameEn")}>
            <Input id={`${prefix}-name-en`} name="nameEn" defaultValue={values.nameEn} invalid={Boolean(fieldErrors.nameEn)} />
          </Field>
          <Field id={`${prefix}-slug`} label={t("blog.slug")} required errors={errorsFor("slug")}>
            <Input id={`${prefix}-slug`} name="slug" defaultValue={values.slug} invalid={Boolean(fieldErrors.slug)} />
          </Field>
          <Field id={`${prefix}-cta`} label={t("blog.cta")} errors={errorsFor("cta")}>
            <Select id={`${prefix}-cta`} name="cta" defaultValue={values.cta}>
              {BLOG_CTAS.map((cta) => <option key={cta} value={cta}>{t(`blog.ctas.${cta}`)}</option>)}
            </Select>
          </Field>
        </div>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" size="sm" disabled={pending} className="max-w-max">
          {props.mode === "create" ? t("blog.createCategory") : t("save")}
        </Button>
      </Stack>
    </form>
  );
}
