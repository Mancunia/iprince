import { describe, expect, it } from "vitest";
import { contactFromForm, contactInput, keepKnownIds, leadFromForm, leadInput } from "./schema";

const P1 = "a0000000-0000-4000-8000-000000000001";
const P2 = "a0000000-0000-4000-8000-000000000002";
const lead = {
  company: " ACME GmbH ",
  contactName: "Erika Muster",
  email: " erika@example.com ",
  phone: "",
  professionIds: [],
  headcount: "",
  message: "",
  hp_field: "",
};
const errorPaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((i) => String(i.path[0])) ?? [];

describe("leadInput", () => {
  it("trims text and turns blank optional fields into null", () => {
    expect(leadInput.parse(lead)).toEqual({
      company: "ACME GmbH",
      contactName: "Erika Muster",
      email: "erika@example.com",
      phone: null,
      professionIds: [],
      headcount: null,
      message: "",
      hp_field: "",
    });
  });

  it("treats a whitespace-only phone as missing", () => {
    expect(leadInput.parse({ ...lead, phone: "   " }).phone).toBeNull();
  });

  it("requires company, contact name and a valid email", () => {
    const result = leadInput.safeParse({ ...lead, company: "   ", contactName: "", email: "not-an-email" });
    expect(errorPaths(result)).toEqual(expect.arrayContaining(["company", "contactName", "email"]));
  });

  it("accepts headcounts from 1 to 999 only", () => {
    expect(leadInput.parse({ ...lead, headcount: "12" }).headcount).toBe(12);
    for (const headcount of ["0", "1000", "2.5", "abc"]) {
      expect(leadInput.safeParse({ ...lead, headcount }).success).toBe(false);
    }
  });

  it("de-duplicates profession ids and rejects non-uuids", () => {
    expect(leadInput.parse({ ...lead, professionIds: [P1, P1, P2] }).professionIds).toEqual([P1, P2]);
    expect(leadInput.safeParse({ ...lead, professionIds: ["pflege"] }).success).toBe(false);
  });

  it("limits lengths", () => {
    expect(leadInput.safeParse({ ...lead, company: "x".repeat(201) }).success).toBe(false);
    expect(leadInput.safeParse({ ...lead, message: "x".repeat(5001) }).success).toBe(false);
    expect(leadInput.safeParse({ ...lead, phone: "1".repeat(51) }).success).toBe(false);
  });
});

describe("contactInput", () => {
  const contact = { name: "Max", email: "max@example.com", message: "Hallo", hp_field: "" };

  it("accepts a complete message", () => {
    expect(contactInput.parse(contact)).toEqual(contact);
  });

  it("requires a non-blank message of at most 5000 characters", () => {
    expect(contactInput.safeParse({ ...contact, message: "   " }).success).toBe(false);
    expect(contactInput.safeParse({ ...contact, message: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("form readers", () => {
  it("reads every lead field, all checked professions and missing fields as empty strings", () => {
    const data = new FormData();
    data.set("company", "ACME");
    data.append("professionIds", P1);
    data.append("professionIds", P2);
    expect(leadFromForm(data)).toEqual({
      company: "ACME",
      contactName: "",
      email: "",
      phone: "",
      professionIds: [P1, P2],
      headcount: "",
      message: "",
      hp_field: "",
    });
  });

  it("reads contact fields", () => {
    const data = new FormData();
    data.set("name", "Max");
    data.set("hp_field", "bot");
    expect(contactFromForm(data)).toEqual({ name: "Max", email: "", message: "", hp_field: "bot" });
  });
});

describe("keepKnownIds", () => {
  it("keeps only known ids in their submitted order", () => {
    expect(keepKnownIds([P2, "b0000000-0000-4000-8000-000000000009", P1], [P1, P2])).toEqual([P2, P1]);
    expect(keepKnownIds([P1], [])).toEqual([]);
  });
});
