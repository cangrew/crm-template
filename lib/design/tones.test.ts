import { describe, expect, it } from "vitest";
import { CARRIER_STATUSES, CLIENT_STATUSES, POLICY_STATUSES } from "@/lib/domain/enums";
import { carrierTone, clientTone, policyTone } from "./tones";

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

  it("carrierTone covers every CarrierStatus with a valid tone class", () => {
    for (const status of CARRIER_STATUSES) {
      const cls = carrierTone[status];
      expect(cls, `carrierTone[${status}]`).toBeDefined();
      expect(VALID_TONE_CLASSES.has(cls)).toBe(true);
    }
  });

  it("policyTone covers every PolicyStatus with a valid tone class", () => {
    for (const status of POLICY_STATUSES) {
      const cls = policyTone[status];
      expect(cls, `policyTone[${status}]`).toBeDefined();
      expect(VALID_TONE_CLASSES.has(cls)).toBe(true);
    }
  });

  it("maps the risk statuses to alarm tones", () => {
    expect(policyTone.active).toBe("t-green");
    expect(policyTone.grace).toBe("t-amber");
    expect(policyTone.lapsed).toBe("t-red");
  });
});
