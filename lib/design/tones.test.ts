import { describe, expect, it } from "vitest";
import { CONTACT_STATUSES } from "@/lib/domain/enums";
import { contactTone } from "./tones";

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
  it("contactTone covers every ContactStatus with a valid tone class", () => {
    for (const status of CONTACT_STATUSES) {
      const cls = contactTone[status];
      expect(cls, `contactTone[${status}]`).toBeDefined();
      expect(VALID_TONE_CLASSES.has(cls)).toBe(true);
    }
  });

  it("at-risk contacts map to red", () => {
    expect(contactTone.at_risk).toBe("t-red");
  });
});
