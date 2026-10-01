import { describe, expect, it } from "vitest";
import { messagePreview, professionNames, telHref } from "./inbox";

describe("professionNames", () => {
  it("resolves known ids in order and skips unknown ones", () => {
    const lookup = new Map([["a", "Pflege"], ["b", "Elektro"]]);
    expect(professionNames(["b", "x", "a"], lookup)).toEqual(["Elektro", "Pflege"]);
  });
});

describe("messagePreview", () => {
  it("collapses whitespace and keeps short text whole", () => {
    expect(messagePreview("Hallo\n\n  Welt")).toBe("Hallo Welt");
  });

  it("cuts long text at 80 characters with an ellipsis", () => {
    const preview = messagePreview("x".repeat(100));
    expect(preview).toBe(`${"x".repeat(80)}…`);
  });

  it("never splits an emoji", () => {
    const preview = messagePreview(`${"x".repeat(79)}😀😀`);
    expect(preview).toBe(`${"x".repeat(79)}😀…`);
  });
});

describe("telHref", () => {
  it("keeps only digits and a leading plus", () => {
    expect(telHref("+49 (0) 173 / 901-8671")).toBe("tel:+4901739018671");
    expect(telHref("0173 9018671")).toBe("tel:01739018671");
  });
});
