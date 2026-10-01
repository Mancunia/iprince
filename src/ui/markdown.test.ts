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
  it("turns a heading 1 in the text into a heading 2 (the page owns the h1)", () => {
    expect(render("# Big")).toContain("<h2>Big</h2>");
  });

  it("opens external links in a new tab without opener access", () => {
    const html = render("[x](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("keeps internal links in the same tab", () => {
    expect(render("[x](/de/blog)")).not.toContain("target=");
  });

  it("lazy-loads images and drops images with an unsafe source", () => {
    expect(render("![Team](https://x.de/a.jpg)")).toContain('loading="lazy"');
    expect(render("![x](data:image/png;base64,AAAA)")).not.toContain("<img");
  });

  it("wraps tables for horizontal scrolling", () => {
    expect(render("| a |\n|---|\n| 1 |")).toContain('<div class="overflow-x-auto"><table>');
  });
});

describe("safeUrl", () => {
  it.each(["javascript:alert(1)", "JAVASCRIPT:x", "data:text/html,x", "vbscript:x"])("blocks %s", (url) => expect(safeUrl(url)).toBe(""));
});
