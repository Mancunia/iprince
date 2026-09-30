import { describe, expect, it } from "vitest";
import { collectFiles } from "./collect-files";
import { formDefinition } from "./definition";

const label = { de: "x", en: "x" };
const def = formDefinition.parse({ fields: [{ key: "cv", type: "file", label }, { key: "note", type: "text", label }] });

describe("collectFiles", () => {
  it("returns chosen files and skips empty inputs", () => {
    const fd = new FormData();
    fd.append("files.cv", new File(["%PDF"], "cv.pdf", { type: "application/pdf" }));
    fd.append("files.cv", new File([], "", { type: "application/octet-stream" }));
    const files = collectFiles(def, fd);
    expect(files.map((f) => [f.fieldKey, f.file.name])).toEqual([["cv", "cv.pdf"]]);
  });
});
