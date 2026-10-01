import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown, safeUrl } from "./Markdown";

const render = (md: string) => renderToStaticMarkup(createElement(Markdown, null, md));

describe("Markdown", () => {
  it("renders headings, lists and tables", () => {
    const html = render("## Title\n\n- one\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<table>");
  });

  it("drops raw HTML", () => {
    const html = render('Hi <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<img");
  });

  it("neutralises javascript: links", () => {
    expect(render("[x](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("keeps mailto, tel, https and relative links", () => {
    const html = render("[a](mailto:a@b.de) [b](tel:+49) [c](https://x.de) [d](/de/privacy)");
    for (const href of ["mailto:a@b.de", "tel:+49", "https://x.de", "/de/privacy"]) expect(html).toContain(`href="${href}"`);
  });
});

describe("safeUrl", () => {
  it.each(["javascript:alert(1)", "JAVASCRIPT:x", "data:text/html,x", "vbscript:x"])("blocks %s", (url) => expect(safeUrl(url)).toBe(""));
});
