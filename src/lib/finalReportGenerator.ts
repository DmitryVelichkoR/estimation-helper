import type { AdaptedAnalysis } from "./analysisAdapter";
import {
  computeTotals,
  getEffectiveOverride,
  type Override,
} from "./estimationTotals";
import { getTechProfile } from "./techProfiles";

function safe(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isNaN(v) ? "—" : String(v);
  if (typeof v === "object") return "—";
  return String(v);
}

function fmtHours(v: number): string {
  if (Number.isNaN(v)) return "—";
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface FinalReportData {
  project: {
    url: string;
    techKey: string;
    techName: string;
    generatedAt: string;
  };
  coverage: {
    urlsDiscovered: number;
    urlsAnalyzed: number;
    urlsFailed: number;
  };
  confidence: number | null;
  warnings: string[];
  totals: {
    devHours: number;
    qaHours: number;
  };
  families: {
    familyId: string;
    label: string;
    componentCount: number;
    devHours: number;
    qaHours: number;
  }[];
  components: {
    signature: string;
    label: string;
    familyId: string;
    complexityHint: string;
    seenCount: number | null;
    devHours: number;
    qaHours: number;
    notes: string | null;
  }[];
}

export function buildFinalReport(
  project: { url: string; techKey: string },
  analysis: AdaptedAnalysis,
  overrides: Override[]
): FinalReportData {
  const techProfile = getTechProfile(project.techKey);
  const totals = computeTotals(analysis, overrides);
  const components = analysis.components.map((c) => {
    const eff = getEffectiveOverride(c, overrides);
    const compOverride = overrides.find(
      (o) => o.targetType === "COMPONENT" && o.targetId === c.signature
    );
    const familyOverride = c.familyId
      ? overrides.find((o) => o.targetType === "FAMILY" && o.targetId === c.familyId)
      : null;
    const override = compOverride ?? familyOverride;
    return {
      signature: c.signature,
      label: c.label,
      familyId: c.familyId ?? "—",
      complexityHint: c.complexityHint ?? "—",
      seenCount: c.seenCount,
      devHours: eff.devHours,
      qaHours: eff.qaHours,
      notes: override?.notes ?? null,
    };
  });

  const warnings: string[] = [];
  if (analysis.kpis.confidence != null && analysis.kpis.confidence < 0.7) {
    warnings.push(`Low confidence (${Math.round((analysis.kpis.confidence ?? 0) * 100)}%)`);
  }
  const failed = analysis.kpis.urlsFailed ?? 0;
  if (failed > 0) {
    warnings.push(`${failed} URL(s) failed to analyze`);
  }

  return {
    project: {
      url: project.url,
      techKey: project.techKey,
      techName: techProfile?.name ?? project.techKey,
      generatedAt: new Date().toISOString(),
    },
    coverage: {
      urlsDiscovered: analysis.kpis.urlsDiscovered ?? 0,
      urlsAnalyzed: analysis.kpis.urlsAnalyzed ?? 0,
      urlsFailed: analysis.kpis.urlsFailed ?? 0,
    },
    confidence: analysis.kpis.confidence,
    warnings,
    totals: {
      devHours: totals.totalDev,
      qaHours: totals.totalQA,
    },
    families: totals.byFamily.map((f) => ({
      familyId: f.familyId,
      label: f.label,
      componentCount: f.componentCount,
      devHours: f.devHours,
      qaHours: f.qaHours,
    })),
    components,
  };
}

export function renderFinalReportHtml(data: FinalReportData): string {
  const p = data.project;
  const c = data.coverage;
  const t = data.totals;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Final Report — ${escapeHtml(safe(p.url))}</title>
  <style>
    :root { --bg: #fafaf9; --surface: #fff; --muted: #78716c; --accent: #57534e; --border: #e7e5e4; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--accent); line-height: 1.5; margin: 0; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.5rem; font-weight: 400; margin: 0 0 2rem; }
    h2 { font-size: 1rem; font-weight: 500; margin: 2rem 0 0.75rem; color: var(--accent); }
    section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
    .metric { }
    .metric-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 1.25rem; font-weight: 500; margin-top: 0.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); }
    th { font-weight: 500; color: var(--muted); }
    tr:last-child td { border-bottom: none; }
    .warnings { color: #b45309; }
    .totals-row { font-weight: 500; background: var(--bg); }
  </style>
</head>
<body>
  <div class="container">
    <h1>Estimation Report</h1>

    <section>
      <h2>Project</h2>
      <p><strong>URL:</strong> ${escapeHtml(safe(p.url))}</p>
      <p><strong>Tech:</strong> ${escapeHtml(safe(p.techName))} (${escapeHtml(safe(p.techKey))})</p>
      <p><strong>Generated:</strong> ${escapeHtml(safe(new Date(p.generatedAt).toLocaleString()))}</p>
    </section>

    <section>
      <h2>Coverage</h2>
      <div class="grid">
        <div class="metric"><div class="metric-label">URLs discovered</div><div class="metric-value">${safe(c.urlsDiscovered)}</div></div>
        <div class="metric"><div class="metric-label">URLs analyzed</div><div class="metric-value">${safe(c.urlsAnalyzed)}</div></div>
        <div class="metric"><div class="metric-label">URLs failed</div><div class="metric-value">${safe(c.urlsFailed)}</div></div>
      </div>
    </section>

    <section>
      <h2>Confidence</h2>
      <p>${data.confidence != null && !Number.isNaN(data.confidence) ? Math.round(data.confidence * 100) + "%" : "—"}</p>
      ${data.warnings.length > 0 ? `<p class="warnings">Warnings: ${escapeHtml(data.warnings.join("; "))}</p>` : ""}
    </section>

    <section>
      <h2>Totals</h2>
      <div class="grid">
        <div class="metric"><div class="metric-label">Total Dev</div><div class="metric-value">${fmtHours(t.devHours)} h</div></div>
        <div class="metric"><div class="metric-label">Total QA</div><div class="metric-value">${fmtHours(t.qaHours)} h</div></div>
      </div>
    </section>

    <section>
      <h2>Families breakdown</h2>
      <table>
        <thead><tr><th>Family</th><th>Components</th><th>Dev (h)</th><th>QA (h)</th></tr></thead>
        <tbody>
          ${data.families.map((f) => `
          <tr>
            <td>${escapeHtml(safe(f.label))}</td>
            <td>${safe(f.componentCount)}</td>
            <td>${fmtHours(f.devHours)}</td>
            <td>${fmtHours(f.qaHours)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Components</h2>
      <table>
        <thead><tr><th>Label</th><th>Family</th><th>Complexity</th><th>Seen</th><th>Dev (h)</th><th>QA (h)</th><th>Notes</th></tr></thead>
        <tbody>
          ${data.components.map((c) => `
          <tr>
            <td>${escapeHtml(safe(c.label))}</td>
            <td>${escapeHtml(safe(c.familyId))}</td>
            <td>${escapeHtml(safe(c.complexityHint))}</td>
            <td>${safe(c.seenCount)}</td>
            <td>${fmtHours(c.devHours)}</td>
            <td>${fmtHours(c.qaHours)}</td>
            <td>${escapeHtml(safe(c.notes))}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </section>
  </div>
</body>
</html>`;
}
