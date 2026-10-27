import { describe, expect, it } from "vitest";
import { shareLinks } from "./share";

const url = "https://iprince.de/de/blog/anerkennung-pflege";
const links = shareLinks(url, "Anerkennung & Visum: Schritt für Schritt");

describe("shareLinks", () => {
  it("passes the article URL to every network", () => {
    expect(new URL(links.linkedin).searchParams.get("url")).toBe(url);
    expect(new URL(links.facebook).searchParams.get("u")).toBe(url);
    expect(new URL(links.x).searchParams.get("url")).toBe(url);
    expect(new URL(links.xing).searchParams.get("url")).toBe(url);
  });

  it("encodes the title so & and umlauts survive", () => {
    expect(new URL(links.x).searchParams.get("text")).toBe("Anerkennung & Visum: Schritt für Schritt");
  });

  it("builds a mail with the title as subject and the URL as body", () => {
    expect(links.email).toBe(`mailto:?subject=Anerkennung%20%26%20Visum%3A%20Schritt%20f%C3%BCr%20Schritt&body=${encodeURIComponent(url)}`);
  });
});
