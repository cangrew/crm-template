import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("namespaces list and detail keys per entity", () => {
    expect(queryKeys.contacts.all).toEqual(["contacts"]);
    expect(queryKeys.contacts.lists()).toEqual(["contacts", "list"]);
    expect(queryKeys.contacts.detail("abc")).toEqual(["contacts", "detail", "abc"]);
  });

  it("scopes documents by contact", () => {
    expect(queryKeys.documents.byContact("c-1")).toEqual(["documents", "byContact", "c-1"]);
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
