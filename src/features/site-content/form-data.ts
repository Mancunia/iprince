import type { FieldErrors } from "@/lib/result";
import { contentSchemas, type ContentKey } from "./content";

const SEGMENT = /^[A-Za-z][A-Za-z0-9-]*$/;
const CONTROL = new Set(["locale", "section"]);

/** `match.title.de=…` → `{ match: { title: { de: … } } }`. Only plain identifier segments; everything else is ignored. */
export function unflatten(formData: FormData): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [name, value] of formData.entries()) {
    if (typeof value !== "string" || CONTROL.has(name)) continue;
    const segments = name.split(".");
    if (!segments.every((s) => SEGMENT.test(s))) continue;
    let node = root;
    for (const segment of segments.slice(0, -1)) {
      const next = node[segment];
      node = (typeof next === "object" && next !== null ? next : (node[segment] = {})) as Record<string, unknown>;
    }
    node[segments[segments.length - 1]] = value;
  }
  return root;
}

/** Field errors keyed by the input's dotted name, so each translated input can show its own error. */
export function fieldErrorsByPath(issues: readonly { path: readonly PropertyKey[] }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) errors[issue.path.map(String).join(".")] = ["invalid"];
  return errors;
}

export function parseSectionForm(key: ContentKey, formData: FormData) {
  const parsed = contentSchemas[key].safeParse(unflatten(formData));
  return parsed.success
    ? ({ success: true, data: parsed.data } as const)
    : ({ success: false, fieldErrors: fieldErrorsByPath(parsed.error.issues) } as const);
}
