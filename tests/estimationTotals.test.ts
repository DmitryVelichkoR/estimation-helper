import { describe, it, expect } from "vitest";
import {
  getEffectiveOverride,
  computeTotals,
  type Override,
} from "../src/lib/estimationTotals";
import type { AdaptedAnalysis } from "../src/lib/analysisAdapter";

const mockAnalysis: AdaptedAnalysis = {
  kpis: {
    urlsDiscovered: 10,
    urlsAnalyzed: 10,
    urlsFailed: 0,
    uniqueComponents: 4,
    families: 2,
    confidence: 0.9,
  },
  families: [
    { familyId: "fam_a", label: "Family A", count: 2 },
    { familyId: "fam_b", label: "Family B", count: 2 },
  ],
  components: [
    { signature: "cmp_1", label: "c1", familyId: "fam_a", complexityHint: "simple", seenCount: 5, firstSeenUrl: "https://a.com", previewPath: null, hasForm: false, hasCarousel: false, hasModal: false, hasScrollAnimation: false, hasDropdown: false },
    { signature: "cmp_2", label: "c2", familyId: "fam_a", complexityHint: "simple", seenCount: 3, firstSeenUrl: "https://a.com", previewPath: null, hasForm: false, hasCarousel: false, hasModal: false, hasScrollAnimation: false, hasDropdown: false },
    { signature: "cmp_3", label: "c3", familyId: "fam_b", complexityHint: "medium", seenCount: 2, firstSeenUrl: "https://b.com", previewPath: null, hasForm: false, hasCarousel: false, hasModal: false, hasScrollAnimation: false, hasDropdown: false },
    { signature: "cmp_4", label: "c4", familyId: "fam_b", complexityHint: "medium", seenCount: 1, firstSeenUrl: "https://b.com", previewPath: null, hasForm: false, hasCarousel: false, hasModal: false, hasScrollAnimation: false, hasDropdown: false },
  ],
};

describe("override precedence", () => {
  it("uses family override when no component override exists", () => {
    const overrides: Override[] = [
      { targetType: "FAMILY", targetId: "fam_a", devHours: 2, qaHours: 1 },
    ];
    const eff = getEffectiveOverride(
      { signature: "cmp_1", familyId: "fam_a" },
      overrides
    );
    expect(eff.source).toBe("family");
    expect(eff.devHours).toBe(2);
    expect(eff.qaHours).toBe(1);
  });

  it("uses component override over family override when both exist", () => {
    const overrides: Override[] = [
      { targetType: "FAMILY", targetId: "fam_a", devHours: 2, qaHours: 1 },
      { targetType: "COMPONENT", targetId: "cmp_1", devHours: 5, qaHours: 3 },
    ];
    const eff = getEffectiveOverride(
      { signature: "cmp_1", familyId: "fam_a" },
      overrides
    );
    expect(eff.source).toBe("component");
    expect(eff.devHours).toBe(5);
    expect(eff.qaHours).toBe(3);
  });

  it("returns zero when no override exists", () => {
    const overrides: Override[] = [];
    const eff = getEffectiveOverride(
      { signature: "cmp_1", familyId: "fam_a" },
      overrides
    );
    expect(eff.source).toBe("none");
    expect(eff.devHours).toBe(0);
    expect(eff.qaHours).toBe(0);
  });
});

describe("totals computation deterministic", () => {
  it("returns same result for same inputs", () => {
    const overrides: Override[] = [
      { targetType: "FAMILY", targetId: "fam_a", devHours: 2, qaHours: 1 },
      { targetType: "FAMILY", targetId: "fam_b", devHours: 3, qaHours: 2 },
      { targetType: "COMPONENT", targetId: "cmp_1", devHours: 10, qaHours: 5 },
    ];
    const a = computeTotals(mockAnalysis, overrides);
    const b = computeTotals(mockAnalysis, overrides);
    expect(a.totalDev).toBe(b.totalDev);
    expect(a.totalQA).toBe(b.totalQA);
    expect(a.byFamily).toEqual(b.byFamily);
  });

  it("computes correct totals with mixed overrides", () => {
    const overrides: Override[] = [
      { targetType: "FAMILY", targetId: "fam_a", devHours: 2, qaHours: 1 },
      { targetType: "COMPONENT", targetId: "cmp_1", devHours: 10, qaHours: 5 },
    ];
    const t = computeTotals(mockAnalysis, overrides);
    // cmp_1: component override 10/5, cmp_2: family override 2/1, cmp_3,cmp_4: no override 0/0
    expect(t.totalDev).toBe(10 + 2 + 0 + 0);
    expect(t.totalQA).toBe(5 + 1 + 0 + 0);
  });
});
