import { describe, expect, it } from "vitest";
import { contactUpdateSchema } from "@/lib/domain/schemas";
import type { Contact } from "@/lib/supabase/types";
import { draftFromContact, draftToPatch } from "./contact-draft";

function makeContact(over: Partial<Contact> = {}): Contact {
  return {
    company: "Analytical Engines Ltd",
    created_at: "2026-05-01T00:00:00Z",
    created_by: null,
    email: "ada@analytical.example",
    id: "c1",
    name: "Ada Lovelace",
    notes: "Met at the spring expo.",
    phone: "+1 555 0101",
    status: "lead",
    updated_at: "2026-05-01T00:00:00Z",
    ...over,
  };
}

describe("draftFromContact", () => {
  it("maps contact values to strings", () => {
    const d = draftFromContact(makeContact());
    expect(d.name).toBe("Ada Lovelace");
    expect(d.company).toBe("Analytical Engines Ltd");
    expect(d.email).toBe("ada@analytical.example");
  });

  it("turns null fields into empty strings", () => {
    const d = draftFromContact(makeContact({ company: null, phone: null, notes: null }));
    expect(d.company).toBe("");
    expect(d.phone).toBe("");
    expect(d.notes).toBe("");
  });
});

describe("draftToPatch", () => {
  it("trims text and produces a schema-valid patch", () => {
    const patch = draftToPatch({
      ...draftFromContact(makeContact()),
      name: "  Ada Lovelace  ",
      company: " Analytical Engines Ltd ",
    });
    expect(patch.name).toBe("Ada Lovelace");
    expect(patch.company).toBe("Analytical Engines Ltd");
    expect(contactUpdateSchema.safeParse(patch).success).toBe(true);
  });

  it("nulls blank optional fields", () => {
    const patch = draftToPatch({
      ...draftFromContact(makeContact()),
      company: "",
      email: "",
      phone: "",
      notes: "",
    });
    expect(patch.company).toBeNull();
    expect(patch.email).toBeNull();
    expect(patch.phone).toBeNull();
    expect(patch.notes).toBeNull();
  });

  it("keeps a blank name so the schema rejects it instead of clearing it", () => {
    const patch = draftToPatch({ ...draftFromContact(makeContact()), name: "   " });
    expect(patch.name).toBe("");
    expect(contactUpdateSchema.safeParse(patch).success).toBe(false);
  });
});
