"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, type FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Input, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { submitLead } from "./actions";

type Option = { id: string; name: string };

export function LeadForm({ professions }: { professions: Option[] }) {
  const t = useTranslations("employers");
  const tf = useTranslations("publicForms");
  const [state, dispatch, pending] = useActionState(submitLead, null);

  if (state?.ok) {
    return (
      <p role="status" className="notice notice-success">
        <Icon name="circle-check" />
        {t("success")}
      </p>
    );
  }

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok && state.formError !== "invalid" ? state.formError : undefined;
  const errorsOf = (key: string) => (fieldErrors[key] ? [tf("errors.invalid")] : undefined);
  const describedBy = (key: string) => (fieldErrors[key] ? `lead-${key}-error` : undefined);

  // Submitting through a handler keeps the typed values: React resets a <form action> after every submit.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md">
        <Text tone="muted" size="sm">{tf("requiredHint")}</Text>
        <Field id="lead-company" label={t("company")} required errors={errorsOf("company")}>
          <Input id="lead-company" name="company" autoComplete="organization" required maxLength={200} invalid={Boolean(fieldErrors.company)} aria-describedby={describedBy("company")} />
        </Field>
        <Field id="lead-contactName" label={t("contactName")} required errors={errorsOf("contactName")}>
          <Input id="lead-contactName" name="contactName" autoComplete="name" required maxLength={200} invalid={Boolean(fieldErrors.contactName)} aria-describedby={describedBy("contactName")} />
        </Field>
        <Field id="lead-email" label={t("email")} required errors={errorsOf("email")}>
          <Input id="lead-email" name="email" type="email" autoComplete="email" required maxLength={254} invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
        </Field>
        <Field id="lead-phone" label={t("phone")} errors={errorsOf("phone")}>
          <Input id="lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={50} invalid={Boolean(fieldErrors.phone)} aria-describedby={describedBy("phone")} />
        </Field>
        {professions.length > 0 ? (
          <fieldset className="field" aria-describedby={describedBy("professionIds")}>
            <legend className="label">{t("professions")}</legend>
            {professions.map((p) => (
              <label key={p.id} className="check">
                <Input type="checkbox" name="professionIds" value={p.id} />
                {p.name}
              </label>
            ))}
          </fieldset>
        ) : null}
        <Field id="lead-headcount" label={t("headcount")} errors={errorsOf("headcount")}>
          <Input id="lead-headcount" name="headcount" type="number" inputMode="numeric" min={1} max={999} step={1} className="max-w-32" invalid={Boolean(fieldErrors.headcount)} aria-describedby={describedBy("headcount")} />
        </Field>
        <Field id="lead-message" label={t("message")} errors={errorsOf("message")}>
          <Textarea id="lead-message" name="message" rows={5} maxLength={5000} invalid={Boolean(fieldErrors.message)} aria-describedby={describedBy("message")} />
        </Field>
        <div aria-hidden="true" inert className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <input name="hp_field" tabIndex={-1} autoComplete="off" />
        </div>
        {formError ? (
          <p role="alert" className="notice notice-error">
            <Icon name="circle-alert" />
            {tf(`errors.${formError === "rate_limited" ? "rate_limited" : "server_error"}`)}
          </p>
        ) : null}
        <Text tone="muted" size="sm">{t("privacy")}</Text>
        <Button type="submit" size="lg" disabled={pending}>{pending ? tf("sending") : t("submit")}</Button>
      </Stack>
    </form>
  );
}
