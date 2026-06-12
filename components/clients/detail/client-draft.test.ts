import { describe, expect, it } from "vitest";
import { clientUpdateSchema } from "@/lib/domain/schemas";
import type { Client } from "@/lib/supabase/types";
import { draftFromClient, draftToPatch } from "./client-draft";

function makeClient(over: Partial<Client> = {}): Client {
  return {
    address: "1 Engine Way, London",
    agent_id: "30000000-0000-4000-8000-000000000001",
    created_at: "2026-05-01T00:00:00Z",
    created_by: null,
    dob: "1815-12-10",
    email: "ada@analytical.example",
    first_name: "Ada",
    id: "c1",
    last_name: "Lovelace",
    notes: "Met at the spring expo.",
    phone: "+1 555 0101",
    status: "prospect",
    updated_at: "2026-05-01T00:00:00Z",
    ...over,
  };
}

describe("draftFromClient", () => {
  it("maps client values to strings", () => {
    const d = draftFromClient(makeClient());
    expect(d.first_name).toBe("Ada");
    expect(d.last_name).toBe("Lovelace");
    expect(d.dob).toBe("1815-12-10");
    expect(d.email).toBe("ada@analytical.example");
    expect(d.agent_id).toBe("30000000-0000-4000-8000-000000000001");
  });

  it("turns null fields into empty strings", () => {
    const d = draftFromClient(
      makeClient({ dob: null, phone: null, address: null, agent_id: null, notes: null }),
    );
    expect(d.dob).toBe("");
    expect(d.phone).toBe("");
    expect(d.address).toBe("");
    expect(d.agent_id).toBe("");
    expect(d.notes).toBe("");
  });
});

describe("draftToPatch", () => {
  it("trims text and produces a schema-valid patch", () => {
    const patch = draftToPatch({
      ...draftFromClient(makeClient()),
      first_name: "  Ada  ",
      last_name: " Lovelace ",
      address: " 1 Engine Way, London ",
    });
    expect(patch.first_name).toBe("Ada");
    expect(patch.last_name).toBe("Lovelace");
    expect(patch.address).toBe("1 Engine Way, London");
    expect(clientUpdateSchema.safeParse(patch).success).toBe(true);
  });

  it("nulls blank optional fields including dob and agent", () => {
    const patch = draftToPatch({
      ...draftFromClient(makeClient()),
      dob: "",
      email: "",
      phone: "",
      address: "",
      agent_id: "",
      notes: "",
    });
    expect(patch.dob).toBeNull();
    expect(patch.email).toBeNull();
    expect(patch.phone).toBeNull();
    expect(patch.address).toBeNull();
    expect(patch.agent_id).toBeNull();
    expect(patch.notes).toBeNull();
  });

  it("keeps a blank name so the schema rejects it instead of clearing it", () => {
    const patch = draftToPatch({ ...draftFromClient(makeClient()), first_name: "   " });
    expect(patch.first_name).toBe("");
    expect(clientUpdateSchema.safeParse(patch).success).toBe(false);
  });
});
