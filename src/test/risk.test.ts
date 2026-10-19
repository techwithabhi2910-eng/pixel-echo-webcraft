import { describe, expect, it } from "vitest";
import { analyzeRisk, type Invoice } from "@/lib/finsight";

const base: Invoice = { id: "1", number: "A-1", vendor: "V", date: "2026-09-02", amount: 1234, category: "Software", description: "x", status: "pending", createdAt: "", sample: true };

describe("risk rules", () => {
  it("flags duplicate invoice IDs", () => {
    const r = analyzeRisk(base, [base, { ...base, id: "2" }]);
    expect(r.reasons.some((x) => x.rule === "Duplicate invoice ID")).toBe(true);
    expect(r.severity).toBe("high");
  });
  it("flags amounts at or above 50,000", () => {
    expect(analyzeRisk({ ...base, amount: 50001 }, [base]).reasons.some((x) => x.rule === "Unusually high amount")).toBe(true);
  });
  it("flags missing description", () => {
    expect(analyzeRisk({ ...base, description: "" }, [base]).reasons.some((x) => x.rule === "Missing fields")).toBe(true);
  });
  it("clean invoice is low risk", () => {
    expect(analyzeRisk(base, [base]).score).toBe(0);
  });
});
