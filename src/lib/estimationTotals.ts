import type { AdaptedAnalysis } from "./analysisAdapter";

export interface Override {
  targetType: "FAMILY" | "COMPONENT";
  targetId: string;
  devHours: number | null;
  qaHours: number | null;
  notes?: string | null;
}

export interface EffectiveHours {
  devHours: number;
  qaHours: number;
  source: "component" | "family" | "none";
}

/**
 * Get effective hours for a component: component override if exists, else family override.
 */
export function getEffectiveOverride(
  component: { signature: string; familyId: string | null },
  overrides: Override[]
): EffectiveHours {
  const compOverride = overrides.find(
    (o) => o.targetType === "COMPONENT" && o.targetId === component.signature
  );
  if (compOverride) {
    return {
      devHours: compOverride.devHours ?? 0,
      qaHours: compOverride.qaHours ?? 0,
      source: "component",
    };
  }
  const familyOverride = component.familyId
    ? overrides.find((o) => o.targetType === "FAMILY" && o.targetId === component.familyId)
    : null;
  if (familyOverride) {
    return {
      devHours: familyOverride.devHours ?? 0,
      qaHours: familyOverride.qaHours ?? 0,
      source: "family",
    };
  }
  return { devHours: 0, qaHours: 0, source: "none" };
}

export interface FamilyTotals {
  familyId: string;
  label: string;
  componentCount: number;
  devHours: number;
  qaHours: number;
}

export interface EstimationTotals {
  totalDev: number;
  totalQA: number;
  byFamily: FamilyTotals[];
}

export function computeTotals(
  analysis: AdaptedAnalysis,
  overrides: Override[]
): EstimationTotals {
  const familyMap = new Map(analysis.families.map((f) => [f.familyId, f.label]));
  const byFamilyMap = new Map<string, FamilyTotals>();

  let totalDev = 0;
  let totalQA = 0;

  for (const c of analysis.components) {
    const eff = getEffectiveOverride(c, overrides);
    totalDev += eff.devHours;
    totalQA += eff.qaHours;

    const fid = c.familyId ?? "_none";
    const label = familyMap.get(fid) ?? fid;
    const existing = byFamilyMap.get(fid);
    if (existing) {
      existing.componentCount += 1;
      existing.devHours += eff.devHours;
      existing.qaHours += eff.qaHours;
    } else {
      byFamilyMap.set(fid, {
        familyId: fid,
        label,
        componentCount: 1,
        devHours: eff.devHours,
        qaHours: eff.qaHours,
      });
    }
  }

  return {
    totalDev,
    totalQA,
    byFamily: Array.from(byFamilyMap.values()),
  };
}
