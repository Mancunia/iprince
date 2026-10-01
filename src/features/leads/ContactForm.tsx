"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, type FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Input, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { submitContact } from "./actions";

export function ContactForm() {
  const t = useTranslations("contact");
  const tf = useTranslations("publicForms");
  const [state, dispatch, pending] = useActionState(submitContact, null);

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
  const describedBy = (key: string) => (fieldErrors[key] ? `contact-${key}-error` : undefined);

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
        <Field id="contact-name" label={t("name")} required errors={errorsOf("name")}>
          <Input id="contact-name" name="name" autoComplete="name" required maxLength={200} invalid={Boolean(fieldErrors.name)} aria-describedby={describedBy("name")} />
        </Field>
        <Field id="contact-email" label={t("email")} required errors={errorsOf("email")}>
          <Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
        </Field>
        <Field id="contact-message" label={t("message")} required errors={errorsOf("message")}>
          <Textarea id="contact-message" name="message" rows={6} required maxLength={5000} invalid={Boolean(fieldErrors.message)} aria-describedby={describedBy("message")} />
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
