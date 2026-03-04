import { describe, it, expect } from "vitest";
import {
  buildFinalReport,
  renderFinalReportHtml,
} from "../src/lib/finalReportGenerator";
import type { AdaptedAnalysis } from "../src/lib/analysisAdapter";
import type { Override } from "../src/lib/estimationTotals";

const mockAnalysis: AdaptedAnalysis = {
  kpis: {
    urlsDiscovered: 5,
    urlsAnalyzed: 5,
    urlsFailed: 0,
    uniqueComponents: 2,
    families: 1,
    confidence: 0.8,
  },
  families: [{ familyId: "fam_x", label: "Family X", count: 2 }],
  components: [
    { signature: "cmp_a", label: "compA", familyId: "fam_x", complexityHint: "simple", seenCount: 3, firstSeenUrl: "https://x.com", previewPath: null, hasForm: false, hasCarousel: false, hasModal: false, hasScrollAnimation: false, hasDropdown: false },
    { signature: "cmp_b", label: "compB", familyId: "fam_x", complexityHint: null, seenCount: null, firstSeenUrl: null, previewPath: null, hasForm: false, hasCarousel: false, hasModal: false, hasScrollAnimation: false, hasDropdown: false },
  ],
};

describe("report HTML does not contain bad strings", () => {
  const badStrings = ["[object Object]", "undefined", "NaN"];

  it("renders clean HTML for normal data", () => {
    const overrides: Override[] = [
      { targetType: "FAMILY", targetId: "fam_x", devHours: 2, qaHours: 1 },
    ];
    const data = buildFinalReport(
      { url: "https://example.com", techKey: "custom" },
      mockAnalysis,
      overrides
    );
    const html = renderFinalReportHtml(data);
    for (const bad of badStrings) {
      expect(html).not.toContain(bad);
    }
  });

  it("renders clean HTML for sparse data with nulls", () => {
    const sparseAnalysis: AdaptedAnalysis = {
      ...mockAnalysis,
      components: [
        { ...mockAnalysis.components[0], complexityHint: null, seenCount: null },
        { ...mockAnalysis.components[1], familyId: null },
      ],
    };
    const data = buildFinalReport(
      { url: "https://x.com", techKey: "custom" },
      sparseAnalysis,
      []
    );
    const html = renderFinalReportHtml(data);
    for (const bad of badStrings) {
      expect(html).not.toContain(bad);
    }
  });

  it("renders clean HTML when confidence is NaN", () => {
    const nanAnalysis: AdaptedAnalysis = {
      ...mockAnalysis,
      kpis: { ...mockAnalysis.kpis, confidence: Number.NaN },
    };
    const data = buildFinalReport(
      { url: "https://x.com", techKey: "custom" },
      nanAnalysis,
      []
    );
    const html = renderFinalReportHtml(data);
    for (const bad of badStrings) {
      expect(html).not.toContain(bad);
    }
  });
});
