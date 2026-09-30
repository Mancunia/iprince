import * as stylex from "@stylexjs/stylex";
import type { Locale } from "@/i18n/config";
import { localized } from "@/lib/i18n/localized";
import type { FieldErrors } from "@/lib/result";
import { Field } from "@/ui/Field";
import { Input, Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { color, font, space } from "@/ui/tokens.stylex";
import { LANGUAGE_LEVELS, type FormDefinition, type FormField } from "./definition";

const styles = stylex.create({
  group: { borderWidth: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.xs },
  legend: { fontWeight: 600, fontSize: font.sizeSm, padding: 0 },
  help: { color: color.textMuted, fontSize: font.sizeSm, margin: 0 },
  error: { color: color.danger, fontSize: font.sizeSm, margin: 0 },
});

const INPUT_TYPES: Partial<Record<FormField["type"], string>> = { text: "text", email: "email", tel: "tel", date: "date", number: "number" };

type Props = {
  definition: FormDefinition;
  locale: Locale;
  errors: FieldErrors;
  errorText: (code: string) => string;
  chooseLabel: string;
};

export function DynamicFields({ definition, locale, errors, errorText, chooseLabel }: Props) {
  return (
    <Stack gap="md">
      {definition.fields.map((field) => (
        <DynamicField key={field.key} field={field} locale={locale} errors={errors[field.key]?.map(errorText)} chooseLabel={chooseLabel} />
      ))}
    </Stack>
  );
}

function DynamicField({ field, locale, errors, chooseLabel }: { field: FormField; locale: Locale; errors?: string[]; chooseLabel: string }) {
  const id = `field-${field.key}`;
  const name = `answers.${field.key}`;
  const label = localized(field.label, locale);
  const help = field.help ? localized(field.help, locale) : undefined;
  const invalid = Boolean(errors?.length);
  const describedBy = [help ? `${id}-help` : null, invalid ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

  if (field.type === "radio" || field.type === "multiselect") {
    return (
      <fieldset {...stylex.props(styles.group)} aria-invalid={invalid || undefined} aria-describedby={describedBy}>
        <legend {...stylex.props(styles.legend)}>
          {label}
          {field.required ? <span aria-hidden="true"> *</span> : null}
        </legend>
        {help ? <p id={`${id}-help`} {...stylex.props(styles.help)}>{help}</p> : null}
        {field.options?.map((option) => (
          <label key={option.value}>
            <Input
              type={field.type === "radio" ? "radio" : "checkbox"}
              name={name}
              value={option.value}
              required={field.type === "radio" && field.required}
            />{" "}
            {localized(option.label, locale)}
          </label>
        ))}
        {invalid ? (
          <div id={`${id}-error`}>
            {errors?.map((message, index) => <p key={`${index}-${message}`} role="alert" {...stylex.props(styles.error)}>{message}</p>)}
          </div>
        ) : null}
      </fieldset>
    );
  }

  return (
    <Field id={id} label={label} required={field.required} help={help} errors={errors}>
      {field.type === "textarea" ? (
        <Textarea id={id} name={name} required={field.required} invalid={invalid} aria-describedby={describedBy} />
      ) : field.type === "select" || field.type === "language_level" ? (
        <Select id={id} name={name} required={field.required} invalid={invalid} aria-describedby={describedBy} defaultValue="">
          <option value="" disabled={field.required}>{chooseLabel}</option>
          {field.type === "language_level"
            ? LANGUAGE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)
            : field.options?.map((o) => <option key={o.value} value={o.value}>{localized(o.label, locale)}</option>)}
        </Select>
      ) : field.type === "checkbox" ? (
        <Input id={id} type="checkbox" name={name} required={field.required} invalid={invalid} aria-describedby={describedBy} />
      ) : field.type === "file" ? (
        <Input
          id={id}
          type="file"
          name={`files.${field.key}`}
          accept={field.accept?.join(",")}
          required={field.required}
          invalid={invalid}
          aria-describedby={describedBy}
        />
      ) : (
        <Input
          id={id}
          type={INPUT_TYPES[field.type] ?? "text"}
          name={name}
          required={field.required}
          invalid={invalid}
          aria-describedby={describedBy}
          step={field.type === "number" ? "any" : undefined}
        />
      )}
    </Field>
  );
}
