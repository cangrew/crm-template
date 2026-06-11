import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { listNotifications, markAllRead, markRead, unreadCount } from "./notifications";

/**
 * Minimal chainable Supabase query-builder stub. Builder methods return the
 * builder; awaiting it (or calling a terminal) resolves the canned result.
 */
function stubClient(result: { data?: unknown; count?: number; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "update", "eq", "is", "order", "limit"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as TypedSupabaseClient, from, builder };
}

describe("notifications api", () => {
  it("listNotifications returns rows from the notifications table", async () => {
    const rows = [{ id: "1" }, { id: "2" }];
    const { client, from } = stubClient({ data: rows, error: null });
    await expect(listNotifications(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("notifications");
  });

  it("listNotifications throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("boom") });
    await expect(listNotifications(client)).rejects.toThrow("boom");
  });

  it("unreadCount returns the exact count of unread rows", async () => {
    const { client, builder } = stubClient({ count: 4, error: null });
    await expect(unreadCount(client)).resolves.toBe(4);
    expect(builder.is).toHaveBeenCalledWith("read_at", null);
  });

  it("unreadCount treats a null count as zero", async () => {
    const { client } = stubClient({ count: undefined, error: null });
    await expect(unreadCount(client)).resolves.toBe(0);
  });

  it("markRead updates read_at for the given id", async () => {
    const { client, builder } = stubClient({ data: null, error: null });
    await markRead(client, "abc");
    expect(builder.update).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith("id", "abc");
  });

  it("markRead throws on error", async () => {
    const { client } = stubClient({ data: null, error: new Error("denied") });
    await expect(markRead(client, "abc")).rejects.toThrow("denied");
  });

  it("markAllRead updates only unread rows", async () => {
    const { client, builder } = stubClient({ data: null, error: null });
    await markAllRead(client);
    expect(builder.update).toHaveBeenCalledTimes(1);
    expect(builder.is).toHaveBeenCalledWith("read_at", null);
  });
});
