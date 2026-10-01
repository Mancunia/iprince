"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { FIELD_TYPES, type FormField } from "../definition";
import type { FieldType } from "./model";

type Props = {
  fields: FormField[];
  selected: number | null;
  locale: Locale;
  hasErrors: (index: number) => boolean;
  onSelect: (index: number) => void;
  onMove: (index: number, delta: -1 | 1) => void;
  onRemove: (index: number) => void;
  onAdd: (type: FieldType) => void;
};

export function FieldList({ fields, selected, locale, hasErrors, onSelect, onMove, onRemove, onAdd }: Props) {
  const t = useTranslations("admin.forms");
  const [type, setType] = useState<FieldType>("text");

  return (
    <Stack gap="sm">
      <Stack as="ul" gap="xs">
        {fields.map((field, i) => {
          const label = localized(field.label, locale) || t("untitled");
          return (
          // Index keys: the answer key is editable, so it cannot identify a row.
          <li key={i}>
            <Stack direction="row" gap="sm">
              <Button variant={selected === i ? "primary" : "secondary"} aria-pressed={selected === i} onClick={() => onSelect(i)}>
                {label} · {t(`types.${field.type}`)}
                {field.required ? " *" : ""}
                {hasErrors(i) ? ` · ${t("needsAttention")}` : ""}
              </Button>
              <Button variant="secondary" aria-label={`${t("moveUp")}: ${label}`} disabled={i === 0} onClick={() => onMove(i, -1)}>↑</Button>
              <Button variant="secondary" aria-label={`${t("moveDown")}: ${label}`} disabled={i === fields.length - 1} onClick={() => onMove(i, 1)}>↓</Button>
              <Button variant="secondary" aria-label={`${t("remove")}: ${label}`} onClick={() => onRemove(i)}>✕</Button>
            </Stack>
          </li>
          );
        })}
      </Stack>
      <Stack direction="row" gap="sm">
        <Select aria-label={t("newFieldType")} value={type} onChange={(e) => setType(e.target.value as FieldType)}>
          {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{t(`types.${ft}`)}</option>)}
        </Select>
        <Button variant="secondary" onClick={() => onAdd(type)}>{t("addField")}</Button>
      </Stack>
    </Stack>
  );
}
