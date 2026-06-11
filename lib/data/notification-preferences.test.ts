import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { listPreferences, setPreference } from "./notification-preferences";

function stubClient(result: { data?: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "upsert", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as TypedSupabaseClient, from, builder };
}

describe("notification preferences api", () => {
  it("listPreferences returns rows for the current user", async () => {
    const rows = [{ user_id: "u1", type: "contact_created", muted: true }];
    const { client, from } = stubClient({ data: rows, error: null });
    await expect(listPreferences(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("notification_preferences");
  });

  it("listPreferences throws on error", async () => {
    const { client } = stubClient({ data: null, error: new Error("boom") });
    await expect(listPreferences(client)).rejects.toThrow("boom");
  });

  it("setPreference upserts the user/type/muted triple", async () => {
    const { client, builder } = stubClient({ data: null, error: null });
    await setPreference(client, "u1", "contact_created", true);
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", type: "contact_created", muted: true }),
      expect.objectContaining({ onConflict: "user_id,type" }),
    );
  });

  it("setPreference throws on error", async () => {
    const { client } = stubClient({ data: null, error: new Error("denied") });
    await expect(setPreference(client, "u1", "contact_created", false)).rejects.toThrow("denied");
  });
});
