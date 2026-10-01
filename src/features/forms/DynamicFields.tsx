import type { Locale } from "@/i18n/config";
import { localized } from "@/lib/i18n/localized";
import type { FieldErrors } from "@/lib/result";
import { Field } from "@/ui/Field";
import { ErrorMessages } from "@/ui/ErrorMessages";
import { Input, Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { LANGUAGE_LEVELS, type FormDefinition, type FormField } from "./definition";

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
      <fieldset className="field" aria-describedby={describedBy}>
        <legend className="label">
          {label}
          {field.required ? <span className="req" aria-hidden="true">*</span> : null}
        </legend>
        {help ? <p id={`${id}-help`} className="hint">{help}</p> : null}
        <div>
          {field.options?.map((option) => (
            <label key={option.value} className={field.type === "radio" ? "radio" : "check"}>
              <Input
                type={field.type === "radio" ? "radio" : "checkbox"}
                name={name}
                value={option.value}
                required={field.type === "radio" && field.required}
                invalid={invalid}
              />
              <span>{localized(option.label, locale)}</span>
            </label>
          ))}
        </div>
        <ErrorMessages id={id} errors={errors} />
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
        <span className="check">
          <Input id={id} type="checkbox" name={name} required={field.required} invalid={invalid} aria-describedby={describedBy} />
        </span>
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
