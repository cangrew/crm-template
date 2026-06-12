import { describe, expect, it } from "vitest";
import { CLIENT_STATUSES } from "@/lib/domain/enums";
import { clientTone } from "./tones";

const VALID_TONE_CLASSES = new Set([
  "t-slate",
  "t-orange",
  "t-amber",
  "t-green",
  "t-red",
  "t-blue",
  "t-indigo",
  "t-teal",
  "t-violet",
  "t-green-solid",
]);

describe("design tone maps", () => {
  it("clientTone covers every ClientStatus with a valid tone class", () => {
    for (const status of CLIENT_STATUSES) {
      const cls = clientTone[status];
      expect(cls, `clientTone[${status}]`).toBeDefined();
      expect(VALID_TONE_CLASSES.has(cls)).toBe(true);
    }
  });

  it("active clients map to green", () => {
    expect(clientTone.active).toBe("t-green");
  });
});
