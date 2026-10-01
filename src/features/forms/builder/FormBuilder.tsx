"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { discardFormDraft, publishFormDraft, saveFormDraft, type Saved } from "../admin-actions";
import type { FormDefinition, FormField } from "../definition";
import { FieldEditor } from "./FieldEditor";
import { FieldList } from "./FieldList";
import { FormPreview } from "./FormPreview";
import {
  errorsUnder, hasErrorsUnder, moveItem, newField, removeAt, selectedAfterMove, selectedAfterRemove, validateDefinition,
  type BuilderErrors,
} from "./model";

type Props = { locale: Locale; formId: string; version: number; initialDefinition: FormDefinition; initialUpdatedAt: string };
type Message = { tone: "success" | "danger"; text: string };

export function FormBuilder({ locale, formId, version, initialDefinition, initialUpdatedAt }: Props) {
  const t = useTranslations("admin.forms");
  const router = useRouter();
  const [definition, setDefinition] = useState(initialDefinition);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [selected, setSelected] = useState<number | null>(initialDefinition.fields.length > 0 ? 0 : null);
  const [errors, setErrors] = useState<BuilderErrors>({});
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const fields = definition.fields;
  const keys = fields.map((f) => f.key);

  function update(next: FormField[], nextSelected: number | null) {
    setDefinition({ ...definition, fields: next });
    setSelected(nextSelected);
    setDirty(true);
    setMessage(null);
  }

  function fail(code: string | undefined, fieldErrors: BuilderErrors = {}) {
    setErrors(fieldErrors);
    setMessage({ tone: "danger", text: t(`errors.${code ?? "server_error"}`) });
  }

  function accept(result: Saved, successText: string): boolean {
    // A failed publish may follow a successful save: adopt the new token either way.
    const token = result.ok ? result.data.updatedAt : result.updatedAt;
    if (token) setUpdatedAt(token);
    if (!result.ok) {
      fail(result.formError, result.fieldErrors);
      return false;
    }
    setErrors({});
    setDirty(false);
    setMessage({ tone: "success", text: successText });
    return true;
  }

  function submit(kind: "save" | "publish") {
    const check = validateDefinition(definition);
    if (!check.ok) return fail("invalid", check.errors);
    startTransition(async () => {
      const input = { locale, formId, expectedUpdatedAt: updatedAt, definition };
      try {
        if (kind === "save") {
          accept(await saveFormDraft(input), t("saved"));
        } else if (accept(await publishFormDraft(input), t("published"))) {
          router.refresh();
        }
      } catch {
        // Network or server failure: keep the user's edits and say so. These actions do not redirect.
        fail("server_error");
      }
    });
  }

  function discard() {
    if (!window.confirm(t("confirmDiscard"))) return;
    startTransition(async () => {
      try {
        const result = await discardFormDraft({ locale, formId });
        if (!result.ok) return fail(result.formError);
        setDirty(false);
        router.refresh();
      } catch {
        fail("server_error");
      }
    });
  }

  const field = selected === null ? undefined : fields[selected];

  return (
    <Stack gap="lg">
      <Text as="h2" size="lg">{t("draftTitle", { version })}</Text>
      <FieldList
        fields={fields}
        selected={selected}
        locale={locale}
        hasErrors={(i) => hasErrorsUnder(errors, `fields.${i}`)}
        onSelect={setSelected}
        onMove={(i, delta) => update(moveItem(fields, i, delta), selectedAfterMove(selected, i, delta))}
        onRemove={(i) => update(removeAt(fields, i), selectedAfterRemove(selected, i))}
        onAdd={(type) => update([...fields, newField(type, keys)], fields.length)}
      />
      {field && selected !== null ? (
        <FieldEditor
          key={`${selected}-${field.type}`}
          field={field}
          index={selected}
          otherKeys={keys.filter((_, i) => i !== selected)}
          errors={errorsUnder(errors, `fields.${selected}`)}
          onChange={(next) => update(fields.map((f, i) => (i === selected ? next : f)), selected)}
        />
      ) : null}
      {message ? <Text role={message.tone === "success" ? "status" : "alert"} tone={message.tone}>{message.text}</Text> : null}
      <Stack direction="row" gap="sm">
        <Button variant="secondary" disabled={pending} onClick={() => submit("save")}>{t("saveDraft")}</Button>
        <Button disabled={pending} onClick={() => submit("publish")}>{t("publish")}</Button>
        <Button variant="secondary" disabled={pending} onClick={discard}>{t("discardDraft")}</Button>
      </Stack>
      <Text as="h2" size="lg">{t("preview")}</Text>
      <FormPreview definition={definition} initialLocale={locale} />
    </Stack>
  );
}
