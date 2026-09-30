"use client";

import * as stylex from "@stylexjs/stylex";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { collectFiles } from "@/features/forms/collect-files";
import { formDataToAnswers } from "@/features/forms/answers";
import type { FormDefinition } from "@/features/forms/definition";
import { DynamicFields } from "@/features/forms/DynamicFields";
import type { FieldErrors } from "@/lib/result";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { finalizeApplication, submitApplication } from "./actions";

const styles = stylex.create({
  honeypot: { position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" },
});

type Props = { professionSlug: string; formId: string; definition: FormDefinition; locale: Locale };
type Phase = "idle" | "sending" | "uploading" | "done";

export function ApplyForm({ professionSlug, formId, definition, locale }: Props) {
  const t = useTranslations("apply");
  const [phase, setPhase] = useState<Phase>("idle");
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const errorText = (code: string) => (t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.invalid"));
  const failWith = (code?: string, errors: FieldErrors = {}) => {
    setPhase("idle");
    setFormError(code);
    setFieldErrors(errors);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const files = collectFiles(definition, data);
    setPhase("sending");
    setFormError(undefined);
    setFieldErrors({});

    try {
      const submitted = await submitApplication({
        professionSlug,
        formId,
        locale,
        fullName: String(data.get("fullName") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        website: String(data.get("website") ?? ""),
        answers: formDataToAnswers(definition, data),
        files: files.map(({ fieldKey, file }) => ({ fieldKey, name: file.name, type: file.type, size: file.size })),
      });
      if (!submitted.ok) return failWith(submitted.formError, submitted.fieldErrors);
      // 0 uploads is legitimate (honeypot trap: the server pretends success). Otherwise counts must match.
      if (submitted.data.uploads.length > 0 && submitted.data.uploads.length !== files.length) return failWith("server_error");

      setPhase("uploading");
      const supabase = createBrowserSupabase();
      // uploads[i] corresponds to files[i] (the server preserves order).
      for (const [i, upload] of submitted.data.uploads.entries()) {
        const { error } = await supabase.storage
          .from("applications")
          .uploadToSignedUrl(upload.path, upload.token, files[i].file, { contentType: files[i].file.type || "application/octet-stream" });
        if (error) return failWith("upload_failed");
      }

      const finalized = await finalizeApplication({
        applicationId: submitted.data.applicationId,
        paths: submitted.data.uploads.map((u) => u.path),
      });
      if (!finalized.ok) return failWith(finalized.formError, finalized.fieldErrors);
      setPhase("done");
    } catch (error) {
      console.error("application submission failed", error);
      failWith("server_error");
    }
  }

  if (phase === "done") return <Text role="status" tone="success">{t("success")}</Text>;

  const busy = phase !== "idle";
  const coreErrors = (key: string) => fieldErrors[key]?.map(errorText);
  const describedBy = (key: string) => (fieldErrors[key]?.length ? `field-${key}-error` : undefined);

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Text tone="muted" size="sm">{t("requiredHint")}</Text>
        <Field id="field-fullName" label={t("fullName")} required errors={coreErrors("fullName")}>
          <Input id="field-fullName" name="fullName" autoComplete="name" required minLength={2} invalid={Boolean(fieldErrors.fullName)} aria-describedby={describedBy("fullName")} />
        </Field>
        <Field id="field-email" label={t("email")} required errors={coreErrors("email")}>
          <Input id="field-email" name="email" type="email" autoComplete="email" required invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
        </Field>
        <Field id="field-phone" label={t("phone")} errors={coreErrors("phone")}>
          <Input id="field-phone" name="phone" type="tel" autoComplete="tel" invalid={Boolean(fieldErrors.phone)} aria-describedby={describedBy("phone")} />
        </Field>
        <div aria-hidden="true" {...stylex.props(styles.honeypot)}>
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <DynamicFields definition={definition} locale={locale} errors={fieldErrors} errorText={errorText} chooseLabel={t("choose")} />
        {formError ? <Text role="alert" tone="danger">{errorText(formError)}</Text> : null}
        <Button type="submit" disabled={busy}>
          {phase === "sending" ? t("sending") : phase === "uploading" ? t("uploading") : t("submit")}
        </Button>
      </Stack>
    </form>
  );
}
