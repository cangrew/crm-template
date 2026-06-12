import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("namespaces list and detail keys per entity", () => {
    expect(queryKeys.clients.all).toEqual(["clients"]);
    expect(queryKeys.clients.lists()).toEqual(["clients", "list"]);
    expect(queryKeys.clients.detail("abc")).toEqual(["clients", "detail", "abc"]);
    expect(queryKeys.clients.byAgent("a-1")).toEqual(["clients", "byAgent", "a-1"]);
  });

  it("scopes documents by client", () => {
    expect(queryKeys.documents.byClient("c-1")).toEqual(["documents", "byClient", "c-1"]);
  });

  it("namespaces policy keys including the per-client and per-agent scopes", () => {
    expect(queryKeys.policies.all).toEqual(["policies"]);
    expect(queryKeys.policies.lists()).toEqual(["policies", "list"]);
    expect(queryKeys.policies.detail("p-1")).toEqual(["policies", "detail", "p-1"]);
    expect(queryKeys.policies.byClient("c-1")).toEqual(["policies", "byClient", "c-1"]);
    expect(queryKeys.policies.byAgent("a-1")).toEqual(["policies", "byAgent", "a-1"]);
  });

  it("scopes carrier economics by carrier", () => {
    expect(queryKeys.carriers.detail("k-1")).toEqual(["carriers", "detail", "k-1"]);
    expect(queryKeys.rateSchedules.byCarrier("k-1")).toEqual(["rateSchedules", "byCarrier", "k-1"]);
    expect(queryKeys.csvMappings.byCarrier("k-1")).toEqual(["csvMappings", "byCarrier", "k-1"]);
  });

  it("exposes profile keys including the current-profile singleton", () => {
    expect(queryKeys.profiles.detail("u")).toEqual(["profiles", "detail", "u"]);
    expect(queryKeys.profiles.current()).toEqual(["profiles", "current"]);
  });

  it("provides notification keys", () => {
    expect(queryKeys.notifications.unreadCount()).toEqual(["notifications", "unreadCount"]);
    expect(queryKeys.notificationPreferences.lists()).toEqual(["notificationPreferences", "list"]);
  });
});
