import { describe, expect, it } from "vitest";
import {
  contactInsertSchema,
  contactUpdateSchema,
  documentInsertSchema,
  profileInsertSchema,
  profileUpdateSchema,
} from "./schemas";

const validContact = {
  name: "Ada Lovelace",
};

describe("contactInsertSchema", () => {
  it("accepts a minimal contact and applies defaults", () => {
    const result = contactInsertSchema.parse(validContact);
    expect(result.status).toBe("lead");
    expect(result.name).toBe("Ada Lovelace");
  });

  it("accepts the optional detail fields", () => {
    const result = contactInsertSchema.parse({
      ...validContact,
      company: "Analytical Engines Ltd",
      email: "ada@example.com",
      phone: "+1 555 0100",
      notes: "Met at the expo.",
    });
    expect(result.company).toBe("Analytical Engines Ltd");
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects a blank name", () => {
    expect(contactInsertSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(contactInsertSchema.safeParse({ ...validContact, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown status", () => {
    expect(contactInsertSchema.safeParse({ ...validContact, status: "vip" }).success).toBe(false);
  });
});

describe("contactUpdateSchema", () => {
  it("accepts a partial patch", () => {
    const result = contactUpdateSchema.parse({ status: "active" });
    expect(result.status).toBe("active");
    expect(result.name).toBeUndefined();
  });

  it("allows nulling the optional detail fields", () => {
    const result = contactUpdateSchema.parse({ company: null, email: null, phone: null });
    expect(result.company).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
  });

  it("rejects a blank name in a patch", () => {
    expect(contactUpdateSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("profileInsertSchema", () => {
  it("defaults new profiles to the member role", () => {
    const result = profileInsertSchema.parse({
      id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
      full_name: "Sam Admin",
      email: "sam@example.com",
    });
    expect(result.role).toBe("member");
    expect(result.is_active).toBe(true);
  });

  it("rejects an unknown role", () => {
    expect(
      profileUpdateSchema.safeParse({
        role: "dispatcher",
      }).success,
    ).toBe(false);
  });
});

describe("documentInsertSchema", () => {
  it("accepts a standalone document without a contact", () => {
    const result = documentInsertSchema.parse({
      kind: "contract",
      storage_path: "general/contract/file.pdf",
    });
    expect(result.contact_id).toBeUndefined();
  });

  it("accepts a document attached to a contact", () => {
    const result = documentInsertSchema.parse({
      contact_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
      kind: "invoice",
      storage_path: "5c0e8c1e/invoice/file.pdf",
    });
    expect(result.contact_id).toBe("5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa");
  });

  it("rejects an unknown kind", () => {
    expect(
      documentInsertSchema.safeParse({ kind: "rate_confirmation", storage_path: "x/y.pdf" })
        .success,
    ).toBe(false);
  });

  it("rejects an empty storage path", () => {
    expect(documentInsertSchema.safeParse({ kind: "other", storage_path: "" }).success).toBe(false);
  });
});
