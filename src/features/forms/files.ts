import type { FieldErrors } from "@/lib/result";
import type { FormDefinition } from "./definition";

export type FileMeta = { fieldKey: string; name: string; type: string; size: number };
export const DEFAULT_MAX_FILE_MB = 10;

export function mimeMatches(pattern: string, mime: string): boolean {
  return pattern.endsWith("/*") ? mime.startsWith(pattern.slice(0, -1)) : pattern === mime;
}

export function validateFiles(def: FormDefinition, files: FileMeta[]): FieldErrors {
  const errors: FieldErrors = {};
  const add = (key: string, code: string) => {
    errors[key] = [...new Set([...(errors[key] ?? []), code])];
  };
  const fileFields = def.fields.filter((f) => f.type === "file");

  for (const file of files) {
    if (!fileFields.some((f) => f.key === file.fieldKey)) add(file.fieldKey, "unknown_field");
  }
  for (const field of fileFields) {
    const mine = files.filter((f) => f.fieldKey === field.key);
    if (field.required && mine.length === 0) add(field.key, "required");
    if (mine.length > 1) add(field.key, "too_many");
    const maxBytes = (field.maxSizeMb ?? DEFAULT_MAX_FILE_MB) * 1024 * 1024;
    for (const file of mine) {
      if (file.size <= 0 || file.size > maxBytes) add(field.key, "too_large");
      if (field.accept?.length && !field.accept.some((pattern) => mimeMatches(pattern, file.type))) add(field.key, "type_not_allowed");
    }
  }
  return errors;
}

/** `<applicationId>/<fieldKey>/<nonce>-<safe name>`. The prefix is what finalize checks ownership against. */
export function buildStoragePath(applicationId: string, fieldKey: string, fileName: string, nonce: string): string {
  const safe = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/\.{2,}/g, "_")
    .slice(-80);
  return `${applicationId}/${fieldKey}/${nonce}-${safe}`;
}
