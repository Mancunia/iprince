import { z } from "zod";
import type { FieldErrors } from "@/lib/result";
import { LANGUAGE_LEVELS, type FormDefinition, type FormField } from "./definition";

function optionalUnless(required: boolean, schema: z.ZodType): z.ZodType {
  return required ? schema : schema.optional();
}

function fieldSchema(field: FormField): z.ZodType {
  const values = (field.options ?? []).map((o) => o.value) as [string, ...string[]];
  switch (field.type) {
    case "checkbox":
      return field.required ? z.literal(true) : z.boolean().default(false);
    case "multiselect":
      return field.required ? z.array(z.enum(values)).min(1) : z.array(z.enum(values)).default([]);
    case "select":
    case "radio":
      return optionalUnless(field.required, z.enum(values));
    case "language_level":
      return optionalUnless(field.required, z.enum(LANGUAGE_LEVELS));
    case "number":
      return optionalUnless(field.required, z.number());
    case "email":
      return optionalUnless(field.required, z.email());
    case "date":
      return optionalUnless(field.required, z.iso.date());
    case "textarea":
      return optionalUnless(field.required, z.string().trim().min(1).max(5000));
    default: // text, tel
      return optionalUnless(field.required, z.string().trim().min(1).max(500));
  }
}

function isMissing(field: FormField, input: Record<string, unknown>, key: string): boolean {
  if (!Object.hasOwn(input, key)) return true;
  const value = input[key];
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (field.type === "checkbox") return value === false;
  if (field.type === "multiselect") return Array.isArray(value) && value.length === 0;
  return false;
}

/** Zod schema for the non-file answers of one form version. */
export function buildAnswerSchema(def: FormDefinition) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of def.fields) {
    if (field.type !== "file") shape[field.key] = fieldSchema(field);
  }
  return z.strictObject(shape);
}

export function validateAnswers(
  def: FormDefinition,
  answers: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; fieldErrors: FieldErrors } {
  // Copy own enumerable properties only, so inherited values are never read as answers.
  const input: Record<string, unknown> =
    typeof answers === "object" && answers !== null && !Array.isArray(answers) ? Object.fromEntries(Object.entries(answers)) : {};
  const result = buildAnswerSchema(def).safeParse(answers === undefined || answers === null ? answers : input);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: FieldErrors = Object.create(null);
  for (const issue of result.error.issues) {
    const key = issue.code === "unrecognized_keys" ? issue.keys[0] : String(issue.path[0] ?? "_form");
    const field = def.fields.find((f) => f.key === key);
    fieldErrors[key] = [field?.required && isMissing(field, input, key) ? "required" : "invalid"];
  }
  return { ok: false, fieldErrors };
}

/** Reads `answers.<key>` inputs from a submitted form. Blank values are omitted. */
export function formDataToAnswers(def: FormDefinition, data: FormData): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const field of def.fields) {
    const name = `answers.${field.key}`;
    if (field.type === "file") continue;
    if (field.type === "checkbox") {
      answers[field.key] = data.get(name) === "on";
      continue;
    }
    if (field.type === "multiselect") {
      const values = data.getAll(name).map(String);
      if (values.length) answers[field.key] = values;
      continue;
    }
    const raw = data.get(name);
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text === "") continue;
    answers[field.key] = field.type === "number" ? Number(text) : text;
  }
  return answers;
}
