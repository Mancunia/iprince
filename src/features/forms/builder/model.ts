import { formDefinition, RESERVED_KEYS, type FormDefinition, type FormField } from "../definition";

export type FieldType = FormField["type"];
/** Validation messages keyed by dotted path, e.g. "fields.3.label.de". */
export type BuilderErrors = Record<string, string[]>;

const CHOICE_TYPES: readonly FieldType[] = ["select", "multiselect", "radio"];
const emptyText = () => ({ de: "", en: "" });

export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  const next = [...list];
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function selectedAfterMove(selected: number | null, index: number, delta: -1 | 1): number | null {
  if (selected === index) return index + delta;
  if (selected === index + delta) return index;
  return selected;
}

export function selectedAfterRemove(selected: number | null, index: number): number | null {
  if (selected === null || selected === index) return null;
  return selected > index ? selected - 1 : selected;
}

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
const MAX_BASE = 36; // leaves room for a "_NN" suffix within the 40-character key limit

const trimKey = (key: string) => key.slice(0, MAX_BASE).replace(/_+$/, "");

/** snake_case answer key from a label; never reserved, never already used. */
export function suggestKey(label: string, existingKeys: readonly string[]): string {
  const slug = trimKey(
    label
      .toLowerCase()
      .replace(/[äöüß]/g, (c) => UMLAUTS[c])
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+/, ""),
  );
  const base = slug === "" ? "field" : /^[a-z]/.test(slug) ? slug : trimKey(`f_${slug}`);
  const taken = new Set([...existingKeys, ...RESERVED_KEYS]);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}_${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export function changeType(field: FormField, type: FieldType): FormField {
  const { options, accept, maxSizeMb, ...rest } = field;
  const next: FormField = { ...rest, type };
  if (CHOICE_TYPES.includes(type)) next.options = options?.length ? options : [{ value: "option_1", label: emptyText() }];
  if (type === "file") {
    next.accept = accept ?? ["application/pdf"];
    next.maxSizeMb = maxSizeMb ?? 10;
  }
  return next;
}

export function newField(type: FieldType, existingKeys: readonly string[]): FormField {
  return changeType({ key: suggestKey("", existingKeys), type: "text", label: emptyText(), required: false }, type);
}

export function nextOptionValue(options: readonly { value: string }[]): string {
  const used = new Set(options.map((o) => o.value));
  for (let n = 1; ; n++) if (!used.has(`option_${n}`)) return `option_${n}`;
}

export function parseAccept(text: string): string[] | undefined {
  const types = text.split(",").map((t) => t.trim()).filter(Boolean);
  return types.length > 0 ? types : undefined;
}

export function validateDefinition(input: unknown): { ok: true; data: FormDefinition } | { ok: false; errors: BuilderErrors } {
  const parsed = formDefinition.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: BuilderErrors = {};
  for (const issue of parsed.error.issues) (errors[issue.path.map(String).join(".")] ??= []).push(issue.message);
  return { ok: false, errors };
}

export function errorsUnder(errors: BuilderErrors, prefix: string): BuilderErrors {
  const out: BuilderErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    if (key === prefix) out[""] = messages;
    else if (key.startsWith(`${prefix}.`)) out[key.slice(prefix.length + 1)] = messages;
  }
  return out;
}

export function hasErrorsUnder(errors: BuilderErrors, prefix: string): boolean {
  return Object.keys(errorsUnder(errors, prefix)).length > 0;
}
