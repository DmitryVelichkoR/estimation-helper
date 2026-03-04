/**
 * Typed parser for analyzer JSON.
 * Handles multiple possible key names across analyzer versions.
 */

export type SiteReport = Record<string, unknown>;

export interface ParsedSiteReport {
  sitemapUrlsDiscovered: number;
  urlsProcessed: number;
  urlsAnalyzed: number;
  urlsFailed: number;
  urlsSkipped: number;
  redirectsDetected: number;
  canonicalsMerged: number;
  effectiveUniquePages: number;
  extraDiscoveredByCrawl: number;
  uniqueComponents: number;
  familiesCount: number;
  confidencePercent: number;
}

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function pick(obj: unknown, ...paths: string[]): number {
  if (obj == null || typeof obj !== "object") return 0;
  const o = obj as Record<string, unknown>;
  for (const path of paths) {
    const parts = path.split(".");
    let val: unknown = o;
    for (const p of parts) {
      val = val != null && typeof val === "object" ? (val as Record<string, unknown>)[p] : undefined;
    }
    const n = num(val);
    if (n > 0 || path === paths[paths.length - 1]) return n;
  }
  return 0;
}

function pickFirst(obj: unknown, keys: string[]): number {
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)?.[k];
    const n = num(v);
    if (n > 0 || k === keys[keys.length - 1]) return n;
  }
  return 0;
}

export function loadSiteReport(json: unknown): ParsedSiteReport {
  const j = json as Record<string, unknown> | null;
  if (!j || typeof j !== "object") {
    return defaultReport();
  }

  const coverage = (j.coverage ?? j.summary ?? j) as Record<string, unknown>;
  const summary = (j.summary ?? j) as Record<string, unknown>;

  const sitemapUrlsDiscovered =
    pickFirst(j, ["urlsDiscovered", "totalUrlsDiscovered"]) ||
    num((coverage as Record<string, unknown>)?.urlsDiscovered) ||
    pick(j, "urls.discovered", "sitemap.discovered");

  const urlsAnalyzed =
    pickFirst(j, ["urlsAnalyzed", "totalUrlsAnalyzed"]) ||
    num((coverage as Record<string, unknown>)?.urlsAnalyzed) ||
    pick(j, "urls.analyzed");

  const urlsFailed = pickFirst(j, ["urlsFailed"]) || num((coverage as Record<string, unknown>)?.urlsFailed) || 0;
  const urlsSkipped = pickFirst(j, ["urlsSkipped"]) || num((coverage as Record<string, unknown>)?.urlsSkipped) || 0;

  const urlsProcessed = pick(summary, "urlsProcessed")
    || (urlsAnalyzed + urlsFailed + urlsSkipped > 0 ? urlsAnalyzed + urlsFailed + urlsSkipped : urlsAnalyzed);

  const redirectsDetected = pickFirst(j, ["redirectsDetected"])
    || pick(summary, "redirectsDetected")
    || pick(j, "redirects.detected");

  const canonicalsMerged = pickFirst(j, ["canonicalsMerged"])
    || pick(summary, "canonicalsMerged")
    || pick(j, "canonicals.merged");

  const uniqueComponents = pickFirst(j, [
    "uniqueComponentsCount",
    "uniqueComponents",
    "totalUniqueComponents",
  ]) || pick(summary, "uniqueComponents") || pick(j, "components.uniqueCount");

  const familiesCount = pickFirst(j, [
    "familiesCount",
    "families",
  ]) || pick(summary, "families") || pick(j, "families.count");

  let confidencePercent = pickFirst(j, ["confidencePercent"])
    || pick(summary, "confidence")
    || pickFirst(j, ["siteConfidence", "confidence"]);
  if (confidencePercent > 0 && confidencePercent <= 1) {
    confidencePercent = Math.round(confidencePercent * 100);
  }

  const extraDiscoveredByCrawl = pickFirst(j, [
    "extraDiscoveredByCrawl",
    "discoveredByCrawl",
  ]) || pick(j, "crawl.extraDiscovered");

  let effectiveUniquePages = pickFirst(j, ["effectiveUniquePages"])
    || pick(summary, "effectiveUniquePages");

  if (effectiveUniquePages === 0) {
    let urlList: unknown[] | undefined;
    if (Array.isArray(j.urlLog)) urlList = j.urlLog;
    else if (Array.isArray(j.pages)) urlList = j.pages;
    else if (Array.isArray(j.urls)) urlList = j.urls;
    else {
      const urlsObj = j.urls as Record<string, unknown> | undefined;
      urlList = Array.isArray(urlsObj?.items) ? urlsObj!.items : undefined;
    }
    if (Array.isArray(urlList) && urlList.length > 0) {
      const keys = new Set<string>();
      for (const entry of urlList) {
        const e = entry as Record<string, unknown>;
        const resp = e.response as Record<string, unknown> | undefined;
        const canonical = (e.canonicalUrl ?? e.canonical ?? resp?.canonical) as string | undefined;
        const finalUrl = (e.finalUrl ?? e.resolvedUrl ?? resp?.finalUrl ?? e.url) as string | undefined;
        const key = (canonical || finalUrl || "").toString().trim();
        if (key) keys.add(key);
      }
      effectiveUniquePages = keys.size;
    } else {
      effectiveUniquePages = urlsAnalyzed;
    }
  }

  return {
    sitemapUrlsDiscovered: sitemapUrlsDiscovered || urlsAnalyzed,
    urlsProcessed,
    urlsAnalyzed,
    urlsFailed,
    urlsSkipped,
    redirectsDetected,
    canonicalsMerged,
    effectiveUniquePages,
    extraDiscoveredByCrawl,
    uniqueComponents,
    familiesCount,
    confidencePercent: Math.min(100, Math.max(0, Math.round(confidencePercent))),
  };
}

function defaultReport(): ParsedSiteReport {
  return {
    sitemapUrlsDiscovered: 0,
    urlsProcessed: 0,
    urlsAnalyzed: 0,
    urlsFailed: 0,
    urlsSkipped: 0,
    redirectsDetected: 0,
    canonicalsMerged: 0,
    effectiveUniquePages: 0,
    extraDiscoveredByCrawl: 0,
    uniqueComponents: 0,
    familiesCount: 0,
    confidencePercent: 0,
  };
}
