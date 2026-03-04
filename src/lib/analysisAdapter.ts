/**
 * Maps raw analyzer JSON into a stable UI shape.
 * Handles missing fields gracefully (outputs "—" or null).
 */

export interface AdaptedKpis {
  urlsDiscovered: number | null;
  urlsAnalyzed: number | null;
  urlsFailed: number | null;
  uniqueComponents: number | null;
  families: number | null;
  confidence: number | null;
}

export interface AdaptedFamily {
  familyId: string;
  label: string;
  count: number;
}

export interface AdaptedComponent {
  signature: string;
  label: string;
  familyId: string | null;
  complexityHint: string | null;
  seenCount: number | null;
  firstSeenUrl: string | null;
  previewPath: string | null;
  hasForm: boolean;
  hasCarousel: boolean;
  hasModal: boolean;
  hasScrollAnimation: boolean;
  hasDropdown: boolean;
  designTier: string | null;
  designMultiplier: number | null;
  motionTier: string | null;
  motionMultiplierSuggested: number | null;
}

export interface AdaptedAnalysis {
  kpis: AdaptedKpis;
  families: AdaptedFamily[];
  components: AdaptedComponent[];
}

function safeNum(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function safeStr(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function safeBool(v: unknown): boolean {
  return v === true;
}

export function adaptAnalysis(raw: Record<string, unknown>): AdaptedAnalysis {
  const coverage = (raw.coverage ?? raw) as Record<string, unknown>;
  const urlsDiscovered =
    safeNum(raw.urlsDiscovered ?? coverage?.urlsDiscovered) ?? safeNum(coverage?.urlsDiscovered);
  const urlsAnalyzed =
    safeNum(raw.urlsAnalyzed ?? coverage?.urlsAnalyzed) ?? safeNum(coverage?.urlsAnalyzed);
  const urlsFailed =
    safeNum(raw.urlsFailed ?? coverage?.urlsFailed) ?? safeNum(coverage?.urlsFailed);
  const uniqueComponents = safeNum(raw.uniqueComponentsCount ?? raw.totalUniqueComponents);
  const familiesCount = safeNum(raw.familiesCount);
  const siteConfidence = raw.siteConfidence;
  const confidence =
    typeof siteConfidence === "number" && !Number.isNaN(siteConfidence)
      ? siteConfidence
      : null;

  const kpis: AdaptedKpis = {
    urlsDiscovered,
    urlsAnalyzed,
    urlsFailed,
    uniqueComponents,
    families: familiesCount,
    confidence,
  };

  const rawFamilies = Array.isArray(raw.families) ? raw.families : [];
  const families: AdaptedFamily[] = rawFamilies.map((f: unknown) => {
    const obj = f as Record<string, unknown>;
    const count =
      safeNum(obj.memberCount) ??
      (Array.isArray(obj.members) ? obj.members.length : 0);
    return {
      familyId: safeStr(obj.familyId ?? obj.id) ?? "—",
      label: safeStr(obj.name ?? obj.label) ?? "—",
      count: count ?? 0,
    };
  });

  const rawLibrary = Array.isArray(raw.componentLibrary) ? raw.componentLibrary : [];
  const components: AdaptedComponent[] = rawLibrary.map((c: unknown) => {
    const obj = c as Record<string, unknown>;
    const rep = (obj.representative ?? {}) as Record<string, unknown>;
    const feat = (obj.features ?? (obj.canonicalSummary as Record<string, unknown>)?.behavior ?? {}) as Record<string, unknown>;
    const canon = (obj.canonicalSummary ?? {}) as Record<string, unknown>;
    const hint = (obj.complexityHint ?? {}) as Record<string, unknown>;

    const rootTag = safeStr(canon.rootTag);
    const sig = safeStr(obj.signature) ?? "—";
    const humanLabel = safeStr(obj.label);
    const label = humanLabel ?? (rootTag ? `${rootTag}_${safeStr(canon.nodeCount) ?? "?"}` : sig);

    const designTier = safeStr(obj.designTier);
    const designMult = safeNum(obj.designMultiplier);
    const motionTier = safeStr(obj.motionTier);
    const motionMult = safeNum(obj.motionMultiplierSuggested);
    return {
      signature: sig,
      label,
      familyId: safeStr(obj.familyId) ?? findFamilyForSignature(rawFamilies, sig),
      complexityHint: safeStr(hint.level) ?? null,
      seenCount: safeNum(obj.seenCount),
      firstSeenUrl: safeStr(obj.firstSeenUrl),
      previewPath: safeStr(rep.previewPath) ?? (obj.previewDataUrl ? "data" : null),
      hasForm: safeBool(feat.hasForm),
      hasCarousel: safeBool(feat.hasCarousel),
      hasModal: safeBool(feat.hasModal),
      hasScrollAnimation: safeBool(feat.hasScrollAnimation),
      hasDropdown: safeBool(feat.hasDropdown),
      designTier: designTier ?? null,
      designMultiplier: designMult != null ? designMult : null,
      motionTier: motionTier ?? null,
      motionMultiplierSuggested: motionMult != null ? motionMult : null,
    };
  });

  return { kpis, families, components };
}

function findFamilyForSignature(
  families: unknown[],
  signature: string
): string | null {
  for (const f of families) {
    const obj = f as Record<string, unknown>;
    const memberSigs = Array.isArray(obj.memberSignatures) ? obj.memberSignatures : [];
    const members = Array.isArray(obj.members) ? obj.members : [];
    const hasMember =
      memberSigs.includes(signature) ||
      members.some((m: unknown) => (m as Record<string, unknown>).signature === signature);
    if (hasMember) return safeStr(obj.familyId ?? obj.id) ?? null;
  }
  return null;
}
