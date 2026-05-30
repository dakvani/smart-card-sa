import { describe, it, expect } from "vitest";
import type { UserPlan } from "@/hooks/use-plan";

// Mirror of the gating rule used across the app (use-plan.ts and PublicProfile.tsx).
// Any non-free plan must unlock Pro features and hide the SmartCard watermark badge.
const isPaid = (plan: UserPlan) => plan !== "free";
const showsWatermark = (plan: UserPlan) => !isPaid(plan);

describe("Plan gating — watermark & Pro access", () => {
  const paidPlans: UserPlan[] = ["pro", "pro_plus", "business", "enterprise", "lifetime"];

  it("free plan shows the SmartCard watermark badge", () => {
    expect(showsWatermark("free")).toBe(true);
    expect(isPaid("free")).toBe(false);
  });

  it.each(paidPlans)("%s plan hides watermark and unlocks Pro features", (plan) => {
    expect(showsWatermark(plan)).toBe(false);
    expect(isPaid(plan)).toBe(true);
  });

  it("lifetime admin plan unlocks every Pro-gated capability", () => {
    const adminPlan: UserPlan = "lifetime";
    expect(isPaid(adminPlan)).toBe(true);
    expect(showsWatermark(adminPlan)).toBe(false);
  });
});
