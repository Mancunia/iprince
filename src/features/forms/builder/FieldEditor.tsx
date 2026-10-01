"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input, Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { FIELD_TYPES, MAX_FILE_MB, type FormField } from "../definition";
import { LocalizedInputs } from "./LocalizedInputs";
import {
  changeType, errorsUnder, hasErrorsUnder, moveItem, nextOptionValue, parseAccept, removeAt, suggestKey,
  type BuilderErrors, type FieldType,
} from "./model";

type Option = NonNullable<FormField["options"]>[number];

const optionName = (option: Option) => option.label.de || option.value;

type Props = {
  field: FormField;
  index: number;
  /** Keys of every other field, for unique key suggestions. */
  otherKeys: string[];
  /** Errors relative to this field ("key", "label.de", "options.0.value", ...). */
  errors: BuilderErrors;
  onChange: (field: FormField) => void;
};

/** Parent remounts this per field and type (`key`), so local text state never leaks between fields. */
export function FieldEditor({ field, index, otherKeys, errors, onChange }: Props) {
  const t = useTranslations("admin.forms");
  const [acceptText, setAcceptText] = useState((field.accept ?? []).join(", "));
  const id = `builder-field-${index}`;
  const set = (patch: Partial<FormField>) => onChange({ ...field, ...patch });
  const check = (path: string) => (hasErrorsUnder(errors, path) ? [t("checkThis")] : undefined);
  const setOptions = (options: Option[]) => set({ options });

  return (
    <Stack as="section" gap="md">
      <LocalizedInputs
        id={`${id}-label`}
        label={t("label")}
        value={field.label}
        required
        errors={errorsUnder(errors, "label")}
        onChange={(label) => {
          // The key follows the German label until someone edits the key by hand.
          const follows = field.key === suggestKey(field.label.de, otherKeys);
          set({ label, ...(follows ? { key: suggestKey(label.de, otherKeys) } : {}) });
        }}
      />
      <Field id={`${id}-key`} label={t("key")} help={t("keyHelp")} required errors={check("key")}>
        <Input id={`${id}-key`} value={field.key} invalid={Boolean(check("key"))} onChange={(e) => set({ key: e.target.value })} />
      </Field>
      <Field id={`${id}-type`} label={t("fieldType")}>
        <Select id={`${id}-type`} value={field.type} onChange={(e) => onChange(changeType(field, e.target.value as FieldType))}>
          {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{t(`types.${ft}`)}</option>)}
        </Select>
      </Field>
      <LocalizedInputs
        id={`${id}-help`}
        label={t("help")}
        value={field.help}
        multiline
        errors={errorsUnder(errors, "help")}
        onChange={(help) => set({ help: help.de || help.en ? help : undefined })}
      />
      <Field id={`${id}-required`} label={t("required")}>
        <Input id={`${id}-required`} type="checkbox" checked={field.required} onChange={(e) => set({ required: e.target.checked })} />
      </Field>

      {field.options ? (
        <Stack gap="sm">
          <Text as="h3" size="md">{t("options")}</Text>
          {field.options.map((option, oi) => (
            <Stack key={oi} direction="row" gap="sm">
              <Field id={`${id}-option-${oi}-value`} label={t("optionValue")} errors={check(`options.${oi}.value`)}>
                <Input
                  id={`${id}-option-${oi}-value`}
                  value={option.value}
                  invalid={Boolean(check(`options.${oi}.value`))}
                  onChange={(e) => setOptions(field.options!.map((o, i) => (i === oi ? { ...o, value: e.target.value } : o)))}
                />
              </Field>
              <LocalizedInputs
                id={`${id}-option-${oi}-label`}
                label={t("optionLabel")}
                value={option.label}
                required
                errors={errorsUnder(errors, `options.${oi}.label`)}
                onChange={(label) => setOptions(field.options!.map((o, i) => (i === oi ? { ...o, label } : o)))}
              />
              <Button variant="secondary" aria-label={`${t("moveUp")}: ${optionName(option)}`} disabled={oi === 0} onClick={() => setOptions(moveItem(field.options!, oi, -1))}>↑</Button>
              <Button variant="secondary" aria-label={`${t("moveDown")}: ${optionName(option)}`} disabled={oi === field.options!.length - 1} onClick={() => setOptions(moveItem(field.options!, oi, 1))}>↓</Button>
              <Button variant="secondary" aria-label={`${t("remove")}: ${optionName(option)}`} disabled={field.options!.length === 1} onClick={() => setOptions(removeAt(field.options!, oi))}>✕</Button>
            </Stack>
          ))}
          <Button
            variant="secondary"
            onClick={() => setOptions([...field.options!, { value: nextOptionValue(field.options!), label: { de: "", en: "" } }])}
          >
            {t("addOption")}
          </Button>
        </Stack>
      ) : null}

      {field.type === "file" ? (
        <Stack direction="row" gap="sm">
          <Field id={`${id}-accept`} label={t("accept")} help={t("acceptHelp")} errors={check("accept")}>
            <Input
              id={`${id}-accept`}
              value={acceptText}
              invalid={Boolean(check("accept"))}
              onChange={(e) => {
                setAcceptText(e.target.value);
                set({ accept: parseAccept(e.target.value) });
              }}
            />
          </Field>
          <Field id={`${id}-max-size`} label={t("maxSizeMb")} errors={check("maxSizeMb")}>
            <Input
              id={`${id}-max-size`}
              type="number"
              min={1}
              max={MAX_FILE_MB}
              value={field.maxSizeMb ?? ""}
              invalid={Boolean(check("maxSizeMb"))}
              onChange={(e) => set({ maxSizeMb: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </Field>
        </Stack>
      ) : null}
    </Stack>
  );
}
