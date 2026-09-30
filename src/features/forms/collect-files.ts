import type { FormDefinition } from "./definition";

/** Files chosen in `files.<key>` inputs. An empty file input submits a nameless 0-byte File, which is skipped. */
export function collectFiles(def: FormDefinition, data: FormData): { fieldKey: string; file: File }[] {
  return def.fields
    .filter((field) => field.type === "file")
    .flatMap((field) =>
      data
        .getAll(`files.${field.key}`)
        .filter((value): value is File => value instanceof File && value.size > 0 && value.name !== "")
        .map((file) => ({ fieldKey: field.key, file })),
    );
}
