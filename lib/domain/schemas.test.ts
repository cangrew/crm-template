import { describe, expect, it } from "vitest";
import {
  agencyInsertSchema,
  agencyUpdateSchema,
  agentInsertSchema,
  agentUpdateSchema,
  carrierInsertSchema,
  carrierUpdateSchema,
  clientInsertSchema,
  clientUpdateSchema,
  csvMappingInsertSchema,
  csvMappingUpdateSchema,
  documentInsertSchema,
  policyInsertSchema,
  policyUpdateSchema,
  profileInsertSchema,
  profileUpdateSchema,
  rateScheduleInsertSchema,
  rateScheduleUpdateSchema,
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

describe("carrierInsertSchema", () => {
  it("accepts a minimal carrier and applies defaults", () => {
    const result = carrierInsertSchema.parse({ name: "Ambetter Health" });
    expect(result.status).toBe("active");
    expect(result.name).toBe("Ambetter Health");
  });

  it("rejects a blank name and an unknown status", () => {
    expect(carrierInsertSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(carrierInsertSchema.safeParse({ name: "X", status: "paused" }).success).toBe(false);
  });
});

describe("carrierUpdateSchema", () => {
  it("accepts a partial patch and a nullable notes clear", () => {
    const result = carrierUpdateSchema.parse({ status: "inactive", notes: null });
    expect(result.status).toBe("inactive");
    expect(result.notes).toBeNull();
    expect(result.name).toBeUndefined();
  });
});

const validPmpmRate = {
  carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
  rate_type: "pmpm",
  business_type: "new_business",
  pmpm_cents: 2200,
  effective_from: "2026-01-01",
};

describe("rateScheduleInsertSchema", () => {
  it("accepts an open-ended PMPM rate", () => {
    const result = rateScheduleInsertSchema.parse(validPmpmRate);
    expect(result.pmpm_cents).toBe(2200);
    expect(result.effective_to).toBeUndefined();
  });

  it("accepts a percent-of-premium rate with a window and state", () => {
    const result = rateScheduleInsertSchema.parse({
      carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
      rate_type: "percent_of_premium",
      business_type: "renewal",
      percent_bps: 300,
      effective_from: "2026-01-01",
      effective_to: "2026-12-31",
      state: "FL",
    });
    expect(result.percent_bps).toBe(300);
    expect(result.state).toBe("FL");
  });

  it("rejects a rate carrying both value columns", () => {
    expect(rateScheduleInsertSchema.safeParse({ ...validPmpmRate, percent_bps: 500 }).success).toBe(
      false,
    );
  });

  it("rejects a rate carrying neither value column", () => {
    expect(rateScheduleInsertSchema.safeParse({ ...validPmpmRate, pmpm_cents: null }).success).toBe(
      false,
    );
    expect(
      rateScheduleInsertSchema.safeParse({
        ...validPmpmRate,
        rate_type: "percent_of_premium",
        pmpm_cents: null,
      }).success,
    ).toBe(false);
  });

  it("rejects a negative PMPM value and out-of-range basis points", () => {
    expect(rateScheduleInsertSchema.safeParse({ ...validPmpmRate, pmpm_cents: -1 }).success).toBe(
      false,
    );
    expect(
      rateScheduleInsertSchema.safeParse({
        ...validPmpmRate,
        rate_type: "percent_of_premium",
        pmpm_cents: null,
        percent_bps: 10001,
      }).success,
    ).toBe(false);
  });
});

describe("rateScheduleUpdateSchema", () => {
  it("accepts a window-only patch without re-stating the value", () => {
    const result = rateScheduleUpdateSchema.parse({ effective_to: "2026-12-31" });
    expect(result.effective_to).toBe("2026-12-31");
  });

  it("re-applies the exactly-one rule when the patch changes rate_type", () => {
    expect(
      rateScheduleUpdateSchema.safeParse({ rate_type: "pmpm", pmpm_cents: null }).success,
    ).toBe(false);
    expect(
      rateScheduleUpdateSchema.safeParse({
        rate_type: "percent_of_premium",
        percent_bps: 500,
        pmpm_cents: null,
      }).success,
    ).toBe(true);
  });
});

describe("csvMappingInsertSchema", () => {
  it("accepts a mapping of statement fields to CSV headers", () => {
    const result = csvMappingInsertSchema.parse({
      carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
      name: "Ambetter monthly statement",
      mapping: { policy_number: "Policy ID", amount: "Commission Paid" },
      header_signature: "policy id|commission paid",
    });
    expect(result.mapping.policy_number).toBe("Policy ID");
  });

  it("rejects a blank name and a non-string mapping value", () => {
    expect(
      csvMappingInsertSchema.safeParse({
        carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
        name: " ",
        mapping: {},
      }).success,
    ).toBe(false);
    expect(
      csvMappingInsertSchema.safeParse({
        carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
        name: "X",
        mapping: { amount: 5 },
      }).success,
    ).toBe(false);
  });

  it("accepts a partial update patch", () => {
    expect(csvMappingUpdateSchema.parse({ header_signature: null }).header_signature).toBeNull();
  });
});

const validPolicy = {
  client_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
  carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1ab",
  agent_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1ac",
};

describe("policyInsertSchema", () => {
  it("accepts a minimal policy and applies defaults", () => {
    const result = policyInsertSchema.parse(validPolicy);
    expect(result.status).toBe("draft");
    expect(result.member_count).toBe(1);
  });

  it("accepts the optional detail fields", () => {
    const result = policyInsertSchema.parse({
      ...validPolicy,
      policy_number: "AMB-1001",
      plan_name: "Ambetter Balanced Care 11",
      member_count: 3,
      monthly_premium_cents: 78000,
      effective_date: "2026-01-01",
      original_effective_date: "2025-01-01",
    });
    expect(result.member_count).toBe(3);
    expect(result.monthly_premium_cents).toBe(78000);
    expect(result.original_effective_date).toBe("2025-01-01");
  });

  it("rejects a missing required id", () => {
    expect(policyInsertSchema.safeParse({ client_id: validPolicy.client_id }).success).toBe(false);
  });

  it("rejects a member count below 1", () => {
    expect(policyInsertSchema.safeParse({ ...validPolicy, member_count: 0 }).success).toBe(false);
  });

  it("rejects a negative premium", () => {
    expect(
      policyInsertSchema.safeParse({ ...validPolicy, monthly_premium_cents: -100 }).success,
    ).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(policyInsertSchema.safeParse({ ...validPolicy, status: "expired" }).success).toBe(false);
  });
});

describe("policyUpdateSchema", () => {
  it("accepts a partial patch with nullable clears", () => {
    const result = policyUpdateSchema.parse({
      status: "active",
      effectuated_at: "2026-01-05",
      termination_date: null,
      notes: null,
    });
    expect(result.status).toBe("active");
    expect(result.termination_date).toBeNull();
    expect(result.client_id).toBeUndefined();
  });

  it("rejects a malformed date in a patch", () => {
    expect(policyUpdateSchema.safeParse({ effective_date: "01/01/2026" }).success).toBe(false);
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
