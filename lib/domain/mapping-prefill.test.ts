import { describe, expect, it } from "vitest";
import { computeHeaderSignature, prefillMapping, type SavedMapping } from "./mapping-prefill";

describe("computeHeaderSignature", () => {
  it("joins headers with | after trimming and lowercasing", () => {
    expect(computeHeaderSignature([" Policy ID ", "Amount Paid"])).toBe("policy id|amount paid");
  });

  it("is order-sensitive (a reordered file is a different layout)", () => {
    expect(computeHeaderSignature(["A", "B"])).not.toBe(computeHeaderSignature(["B", "A"]));
  });

  it("returns an empty string for no headers", () => {
    expect(computeHeaderSignature([])).toBe("");
  });
});

describe("prefillMapping", () => {
  const headers = ["Policy ID", "Member Name", "Amount Paid"];

  function saved(mapping: Record<string, string>, header_signature: string | null): SavedMapping {
    return { mapping, header_signature };
  }

  it("returns an empty mapping with source 'none' when nothing is saved", () => {
    const res = prefillMapping(headers, []);
    expect(res.source).toBe("none");
    expect(res.mapping).toEqual({});
  });

  it("uses the saved mapping whose header_signature matches this file", () => {
    const res = prefillMapping(headers, [
      saved({ policy_number: "Other Col", amount: "Other Amt" }, "some|other|file"),
      saved(
        { policy_number: "Policy ID", subscriber_name: "Member Name", amount: "Amount Paid" },
        computeHeaderSignature(headers),
      ),
    ]);
    expect(res.source).toBe("signature");
    expect(res.mapping).toEqual({
      policy_number: "Policy ID",
      subscriber_name: "Member Name",
      amount: "Amount Paid",
    });
  });

  it("re-resolves signature-matched values to this file's actual header casing", () => {
    const res = prefillMapping(
      ["POLICY ID", "AMOUNT PAID"],
      [
        saved(
          { policy_number: "Policy ID", amount: "Amount Paid" },
          computeHeaderSignature(["POLICY ID", "AMOUNT PAID"]),
        ),
      ],
    );
    expect(res.source).toBe("signature");
    expect(res.mapping).toEqual({ policy_number: "POLICY ID", amount: "AMOUNT PAID" });
  });

  it("drops signature-matched fields whose header is missing from this file", () => {
    const res = prefillMapping(headers, [
      saved(
        { policy_number: "Policy ID", premium: "Gross Premium" },
        computeHeaderSignature(headers),
      ),
    ]);
    expect(res.mapping).toEqual({ policy_number: "Policy ID" });
  });

  it("falls back to case-insensitive exact header matches across any saved mapping", () => {
    const res = prefillMapping(headers, [
      saved({ policy_number: "policy id", premium: "Gross Premium" }, "different|layout"),
      saved({ amount: "AMOUNT PAID" }, null),
    ]);
    expect(res.source).toBe("fuzzy");
    expect(res.mapping).toEqual({ policy_number: "Policy ID", amount: "Amount Paid" });
  });

  it("leaves fields unmapped when no saved header name exists in this file", () => {
    const res = prefillMapping(headers, [saved({ amount: "Commission Amt" }, "other|layout")]);
    expect(res.source).toBe("none");
    expect(res.mapping).toEqual({});
  });

  it("prefers the earlier saved mapping when several bind the same field", () => {
    const res = prefillMapping(
      ["Amount Paid", "Amt"],
      [saved({ amount: "Amount Paid" }, "x"), saved({ amount: "Amt" }, "y")],
    );
    expect(res.mapping.amount).toBe("Amount Paid");
  });
});
