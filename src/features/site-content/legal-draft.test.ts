import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEAD_RETENTION_MONTHS, MESSAGE_RETENTION_MONTHS } from "@/features/leads/retention";
import { LEGAL_DRAFT } from "./legal-draft";
import { hasPlaceholder } from "./legal-check";

const sql = readFileSync(path.join(process.cwd(), "supabase/migrations/20261001000003_legal_drafts.sql"), "utf8");
const block = (tag: string) => {
  const match = sql.match(new RegExp(`\\$${tag}\\$\\n([\\s\\S]*?)\\n\\$${tag}\\$`));
  if (!match) throw new Error(`no $${tag}$ block`);
  return match[1];
};

describe("legal drafts", () => {
  it.each([
    ["imprint_de", LEGAL_DRAFT["legal.imprint"].body.de],
    ["imprint_en", LEGAL_DRAFT["legal.imprint"].body.en],
    ["privacy_de", LEGAL_DRAFT["legal.privacy"].body.de],
    ["privacy_en", LEGAL_DRAFT["legal.privacy"].body.en],
  ])("the migration's %s equals legal-draft.ts", (tag, text) => expect(block(tag)).toBe(text));

  it("state the retention periods the code enforces", () => {
    const { de, en } = LEGAL_DRAFT["legal.privacy"].body;
    expect(de).toContain("innerhalb von 48 Stunden");
    expect(de).toContain(`${MESSAGE_RETENTION_MONTHS} Monate nach`);
    expect(de).toContain(`${LEAD_RETENTION_MONTHS} Monate nach`);
    expect(en).toContain("within 48 hours");
    expect(en).toContain(`${MESSAGE_RETENTION_MONTHS} months after`);
    expect(en).toContain(`${LEAD_RETENTION_MONTHS} months after`);
  });

  it("are marked as drafts so the launch gate blocks them", () => {
    for (const draft of Object.values(LEGAL_DRAFT)) {
      expect(hasPlaceholder(draft.body.de)).toBe(true);
      expect(hasPlaceholder(draft.body.en)).toBe(true);
    }
  });
});
