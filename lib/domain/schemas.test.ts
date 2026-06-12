import { describe, expect, it } from "vitest";
import {
  agencyInsertSchema,
  agencyUpdateSchema,
  agentInsertSchema,
  agentUpdateSchema,
  clientInsertSchema,
  clientUpdateSchema,
  documentInsertSchema,
  profileInsertSchema,
  profileUpdateSchema,
} from "./schemas";

const validClient = {
  first_name: "Ada",
  last_name: "Lovelace",
};

describe("clientInsertSchema", () => {
  it("accepts a minimal client and applies defaults", () => {
    const result = clientInsertSchema.parse(validClient);
    expect(result.status).toBe("prospect");
    expect(result.first_name).toBe("Ada");
    expect(result.last_name).toBe("Lovelace");
  });

  it("accepts the optional detail fields", () => {
    const result = clientInsertSchema.parse({
      ...validClient,
      dob: "1815-12-10",
      email: "ada@example.com",
      phone: "+1 555 0100",
      address: "1 Engine Way, London",
      agent_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
      notes: "Met at the expo.",
    });
    expect(result.dob).toBe("1815-12-10");
    expect(result.email).toBe("ada@example.com");
    expect(result.agent_id).toBe("5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa");
  });

  it("accepts an unassigned (house) client with a null agent", () => {
    const result = clientInsertSchema.parse({ ...validClient, agent_id: null });
    expect(result.agent_id).toBeNull();
  });

  it("rejects blank names", () => {
    expect(clientInsertSchema.safeParse({ first_name: "   ", last_name: "X" }).success).toBe(false);
    expect(clientInsertSchema.safeParse({ first_name: "X", last_name: "" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(clientInsertSchema.safeParse({ ...validClient, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("rejects a malformed dob", () => {
    expect(clientInsertSchema.safeParse({ ...validClient, dob: "12/10/1815" }).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(clientInsertSchema.safeParse({ ...validClient, status: "vip" }).success).toBe(false);
  });
});

describe("clientUpdateSchema", () => {
  it("accepts a partial patch", () => {
    const result = clientUpdateSchema.parse({ status: "active" });
    expect(result.status).toBe("active");
    expect(result.first_name).toBeUndefined();
  });

  it("allows nulling the optional detail fields", () => {
    const result = clientUpdateSchema.parse({
      dob: null,
      email: null,
      phone: null,
      address: null,
      agent_id: null,
    });
    expect(result.dob).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.agent_id).toBeNull();
  });

  it("rejects a blank name in a patch", () => {
    expect(clientUpdateSchema.safeParse({ first_name: "" }).success).toBe(false);
    expect(clientUpdateSchema.safeParse({ last_name: "  " }).success).toBe(false);
  });
});

describe("profileInsertSchema", () => {
  it("defaults new profiles to the agent role", () => {
    const result = profileInsertSchema.parse({
      id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
      full_name: "Sam Admin",
      email: "sam@example.com",
    });
    expect(result.role).toBe("agent");
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

describe("agencyInsertSchema", () => {
  it("accepts a minimal agency and applies defaults", () => {
    const result = agencyInsertSchema.parse({ name: "Harbor Agency" });
    expect(result.status).toBe("active");
    expect(result.commission_cut_bps).toBe(0);
    expect(result.override_cut_bps).toBe(0);
  });

  it("accepts cuts across the full basis-point range", () => {
    const result = agencyInsertSchema.parse({
      name: "Harbor Agency",
      commission_cut_bps: 10000,
      override_cut_bps: 0,
    });
    expect(result.commission_cut_bps).toBe(10000);
  });

  it("rejects out-of-range or fractional basis points", () => {
    expect(agencyInsertSchema.safeParse({ name: "X", commission_cut_bps: 10001 }).success).toBe(
      false,
    );
    expect(agencyInsertSchema.safeParse({ name: "X", override_cut_bps: -1 }).success).toBe(false);
    expect(agencyInsertSchema.safeParse({ name: "X", commission_cut_bps: 12.5 }).success).toBe(
      false,
    );
  });

  it("rejects a blank name", () => {
    expect(agencyInsertSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});

describe("agencyUpdateSchema", () => {
  it("accepts a partial cut adjustment", () => {
    const result = agencyUpdateSchema.parse({ commission_cut_bps: 5500 });
    expect(result.commission_cut_bps).toBe(5500);
    expect(result.name).toBeUndefined();
  });

  it("allows detaching the owner profile", () => {
    expect(agencyUpdateSchema.parse({ owner_profile_id: null }).owner_profile_id).toBeNull();
  });
});

describe("agentInsertSchema", () => {
  it("accepts a minimal agent and applies defaults", () => {
    const result = agentInsertSchema.parse({ full_name: "Andy Agent" });
    expect(result.status).toBe("active");
    expect(result.commission_split_bps).toBe(8000);
    expect(result.agency_id).toBeUndefined();
  });

  it("accepts a direct (house) agent with a null agency", () => {
    const result = agentInsertSchema.parse({ full_name: "Dina Direct", agency_id: null });
    expect(result.agency_id).toBeNull();
  });

  it("rejects an out-of-range split", () => {
    expect(
      agentInsertSchema.safeParse({ full_name: "X", commission_split_bps: 10500 }).success,
    ).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(agentInsertSchema.safeParse({ full_name: "X", email: "nope" }).success).toBe(false);
  });
});

describe("agentUpdateSchema", () => {
  it("accepts a partial patch and nullable clears", () => {
    const result = agentUpdateSchema.parse({ status: "terminated", agency_id: null, npn: null });
    expect(result.status).toBe("terminated");
    expect(result.agency_id).toBeNull();
    expect(result.npn).toBeNull();
  });

  it("rejects an unknown status", () => {
    expect(agentUpdateSchema.safeParse({ status: "retired" }).success).toBe(false);
  });
});

describe("documentInsertSchema", () => {
  it("accepts a standalone document without a client", () => {
    const result = documentInsertSchema.parse({
      kind: "contract",
      storage_path: "general/contract/file.pdf",
    });
    expect(result.client_id).toBeUndefined();
  });

  it("accepts a document attached to a client", () => {
    const result = documentInsertSchema.parse({
      client_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
      kind: "invoice",
      storage_path: "5c0e8c1e/invoice/file.pdf",
    });
    expect(result.client_id).toBe("5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa");
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
