"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { adaptAnalysis } from "@/src/lib/analysisAdapter";
import type { AdaptedAnalysis, AdaptedComponent } from "@/src/lib/analysisAdapter";
import { techProfiles, getTechProfile } from "@/src/lib/techProfiles";

type Complexity = "simple" | "medium" | "complex";
type DesignTier = "low" | "medium" | "high" | "premium";
type MotionTier = "none" | "basic" | "advanced";

const DESIGN_MULTIPLIERS: Record<DesignTier, number> = {
  low: 1.0,
  medium: 1.05,
  high: 1.15,
  premium: 1.3,
};

const MOTION_MULTIPLIERS: Record<MotionTier, number> = {
  none: 1.0,
  basic: 1.1,
  advanced: 1.2,
};

interface EstimateRow extends AdaptedComponent {
  complexity: Complexity;
  devHours: number;
  qaHours: number;
  notes: string;
  previewDataUrl?: string | null;
  designTier: DesignTier;
  designMultiplier: number;
  motionTier: MotionTier;
  motionMultiplierSuggested: number;
  applyMotionMultiplier: boolean;
}

function fmt(v: number | null | undefined): string {
  return v != null ? String(v) : "—";
}

export default function EstimatePage() {
  const [report, setReport] = useState<AdaptedAnalysis | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [rows, setRows] = useState<EstimateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [complexityFilter, setComplexityFilter] = useState<Complexity | "">("");
  const [sortBy, setSortBy] = useState<"label" | "pagesUsed" | "devHours" | "qaHours">("label");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [techStackKey, setTechStackKey] = useState<string>("jamstack");

  const techProfile = getTechProfile(techStackKey) ?? getTechProfile("jamstack")!;
  const techMultiplier = techProfile.devMultiplier;

  const estimationStacks = techProfiles.filter((p) =>
    ["jamstack", "nextjs", "gatsby", "wordpress", "webflow"].includes(p.key)
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setReport(null);
    setRows([]);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as Record<string, unknown>;
        const adapted = adaptAnalysis(json);
        setReport(adapted);
        setBaseUrl(String(json.baseUrl ?? ""));

        const rawLibrary = Array.isArray(json.componentLibrary) ? json.componentLibrary : [];
        const initialRows: EstimateRow[] = adapted.components.map((c) => {
          const raw = rawLibrary.find(
            (r: unknown) => (r as Record<string, unknown>)?.signature === c.signature
          ) as Record<string, unknown> | undefined;
          const pagesUsed = c.seenCount ?? (raw ? Number(raw.seenCount) : 0) ?? 0;
          const hint = (c.complexityHint ?? "").toLowerCase();
          const complexity: Complexity =
            hint === "medium" ? "medium" : hint === "complex" ? "complex" : "simple";
          const devHours = raw && typeof raw.devHours === "number" ? raw.devHours : 0;
          const qaHours = raw && typeof raw.qaHours === "number" ? raw.qaHours : devHours * 0.5;
          const previewDataUrl = raw?.previewDataUrl as string | undefined;
          const rawTier = (raw?.designTier ?? c.designTier ?? "low") as string;
          const designTier: DesignTier =
            ["low", "medium", "high", "premium"].includes(rawTier) ? rawTier : "low";
          const designMultiplier =
            raw && typeof raw.designMultiplier === "number"
              ? Math.min(1.3, Math.max(1.0, raw.designMultiplier))
              : DESIGN_MULTIPLIERS[designTier];
          const rawMotionTier = (raw?.motionTier ?? c.motionTier ?? "none") as string;
          const motionTier: MotionTier =
            ["none", "basic", "advanced"].includes(rawMotionTier) ? rawMotionTier : "none";
          const motionMultiplierSuggested =
            raw && typeof raw.motionMultiplierSuggested === "number"
              ? Math.min(1.2, Math.max(1.0, raw.motionMultiplierSuggested))
              : MOTION_MULTIPLIERS[motionTier];
          return {
            ...c,
            seenCount: pagesUsed,
            complexity,
            devHours,
            qaHours,
            notes: "",
            previewDataUrl: previewDataUrl || null,
            designTier,
            designMultiplier,
            motionTier,
            motionMultiplierSuggested,
            applyMotionMultiplier: false,
          };
        });
        setRows(initialRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse JSON");
      }
    };
    reader.readAsText(file);
  }

  const filteredRows = useMemo(() => {
    let list = rows;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((r) => r.label?.toLowerCase().includes(q));
    }
    if (complexityFilter) {
      list = list.filter((r) => r.complexity === complexityFilter);
    }
    return list;
  }, [rows, search, complexityFilter]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    const techMult = techMultiplier;
    list.sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortBy) {
        case "label":
          va = (a.label ?? "").toLowerCase();
          vb = (b.label ?? "").toLowerCase();
          return sortDir === "asc"
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va));
        case "pagesUsed":
          va = a.seenCount ?? 0;
          vb = b.seenCount ?? 0;
          return sortDir === "asc" ? va - vb : vb - va;
        case "devHours":
          va =
            a.devHours *
            techMult *
            (a.designMultiplier ?? 1) *
            (a.applyMotionMultiplier ? (a.motionMultiplierSuggested ?? 1) : 1);
          vb =
            b.devHours *
            techMult *
            (b.designMultiplier ?? 1) *
            (b.applyMotionMultiplier ? (b.motionMultiplierSuggested ?? 1) : 1);
          return sortDir === "asc" ? va - vb : vb - va;
        case "qaHours":
          va = a.qaHours;
          vb = b.qaHours;
          return sortDir === "asc" ? va - vb : vb - va;
        default:
          return 0;
      }
    });
    return list;
  }, [filteredRows, sortBy, sortDir, techMultiplier]);

  function updateRow(signature: string, patch: Partial<EstimateRow>) {
    setRows((prev) =>
      prev.map((r) =>
        r.signature === signature ? { ...r, ...patch } : r
      )
    );
  }

  function handleDevHoursChange(signature: string, val: number) {
    const row = rows.find((r) => r.signature === signature);
    if (!row) return;
    const devHours = Math.max(0, val);
    const qaHours = row.qaHours === row.devHours * 0.5 ? devHours * 0.5 : row.qaHours;
    updateRow(signature, { devHours, qaHours });
  }

  const totals = useMemo(() => {
    const totalBaseDev = sortedRows.reduce((s, r) => s + r.devHours, 0);
    const totalAdjustedDev = sortedRows.reduce(
      (s, r) =>
        s +
        r.devHours *
          techMultiplier *
          (r.designMultiplier ?? 1) *
          (r.applyMotionMultiplier ? (r.motionMultiplierSuggested ?? 1) : 1),
      0
    );
    const totalQA = sortedRows.reduce((s, r) => s + r.qaHours, 0);
    return {
      totalBaseDev,
      totalAdjustedDev,
      totalQA,
      grandTotal: totalAdjustedDev + totalQA,
    };
  }, [sortedRows, techMultiplier]);

  const siteUrl = baseUrl || "—";

  return (
    <main>
      <header className="border-b border-studio-border bg-studio-surface">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-medium text-studio-accent">
            Estimation Studio
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/app/estimates"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              Estimates
            </Link>
            <Link
              href="/app/new"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              New
            </Link>
            <Link
              href="/app/estimate"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              Estimate
            </Link>
            <Link
              href="/app/site-surface"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              Site surface
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        <h1 className="text-2xl font-light text-studio-accent">
          Component estimation
        </h1>
        <p className="text-studio-muted">
          Upload site-report.json to assign hours to components.
        </p>

        <div>
          <label className="block text-sm font-medium text-studio-accent mb-2">
            Upload site-report.json
          </label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="block w-full text-sm text-studio-muted file:mr-4 file:rounded-md file:border-0 file:bg-studio-border file:px-4 file:py-2 file:text-sm file:font-medium file:text-studio-accent hover:file:bg-studio-muted/20"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && rows.length > 0 && (
          <>
            <section>
              <label className="block text-sm font-medium text-studio-accent mb-2">
                Technology stack
              </label>
              <select
                value={techStackKey}
                onChange={(e) => setTechStackKey(e.target.value)}
                className="px-3 py-2 text-sm border border-studio-border rounded-lg bg-studio-surface text-studio-accent"
              >
                {estimationStacks.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name} ({p.devMultiplier})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-studio-muted">
                Dev hours × {techMultiplier}. QA hours unchanged.
              </p>
            </section>

            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-studio-border bg-studio-surface px-4 py-3">
                <div className="text-xs text-studio-muted uppercase tracking-wide">Site URL</div>
                <div className="text-sm font-medium text-studio-accent mt-1 truncate" title={String(siteUrl)}>
                  {String(siteUrl).replace(/^https?:\/\//, "").slice(0, 40)}
                  {String(siteUrl).length > 40 ? "…" : ""}
                </div>
              </div>
              <div className="rounded-lg border border-studio-border bg-studio-surface px-4 py-3">
                <div className="text-xs text-studio-muted uppercase tracking-wide">Total pages</div>
                <div className="text-lg font-medium text-studio-accent mt-1">
                  {fmt(report.kpis.urlsAnalyzed)}
                </div>
              </div>
              <div className="rounded-lg border border-studio-border bg-studio-surface px-4 py-3">
                <div className="text-xs text-studio-muted uppercase tracking-wide">Unique components</div>
                <div className="text-lg font-medium text-studio-accent mt-1">
                  {fmt(report.kpis.uniqueComponents)}
                </div>
              </div>
              <div className="rounded-lg border border-studio-border bg-studio-surface px-4 py-3">
                <div className="text-xs text-studio-muted uppercase tracking-wide">Component families</div>
                <div className="text-lg font-medium text-studio-accent mt-1">
                  {fmt(report.kpis.families)}
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="text"
                placeholder="Search by component name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 text-sm border border-studio-border rounded-lg bg-studio-surface text-studio-accent placeholder:text-studio-muted min-w-[220px]"
              />
              <select
                value={complexityFilter}
                onChange={(e) => setComplexityFilter((e.target.value || "") as Complexity | "")}
                className="px-3 py-2 text-sm border border-studio-border rounded-lg bg-studio-surface text-studio-accent"
              >
                <option value="">All complexity</option>
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
              <div className="flex gap-2 ml-auto">
                <span className="text-xs text-studio-muted self-center">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 text-sm border border-studio-border rounded-lg bg-studio-surface text-studio-accent"
                >
                  <option value="label">Name</option>
                  <option value="pagesUsed">Pages used</option>
                  <option value="devHours">Dev hours</option>
                  <option value="qaHours">QA hours</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="px-3 py-2 text-sm border border-studio-border rounded-lg bg-studio-surface text-studio-accent hover:bg-studio-border"
                >
                  {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-studio-border bg-studio-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-studio-border bg-studio-bg">
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-20">Preview</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent">Component name</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-24">Pages used</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-32">Complexity</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-28">Design</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-28">Motion</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-24">Base dev hours</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-28">Adjusted dev hours</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent w-28">QA hours</th>
                      <th className="text-left px-4 py-3 font-medium text-studio-accent">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => {
                      const previewSrc = row.previewDataUrl ?? (row as { previewUrl?: string }).previewUrl;
                      return (
                        <tr key={row.signature} className="border-b border-studio-border last:border-0 hover:bg-studio-bg/50">
                          <td className="px-4 py-2">
                            {previewSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewSrc}
                                alt=""
                                className="w-16 h-12 object-cover rounded bg-studio-border"
                              />
                            ) : (
                              <div className="w-16 h-12 rounded bg-studio-border flex items-center justify-center text-studio-muted text-xs">
                                —
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium text-studio-accent">
                            {row.label ?? row.signature}
                          </td>
                          <td className="px-4 py-2 text-studio-muted">
                            {fmt(row.seenCount)}
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={row.complexity}
                              onChange={(e) =>
                                updateRow(row.signature, {
                                  complexity: e.target.value as Complexity,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
                            >
                              <option value="simple">Simple</option>
                              <option value="medium">Medium</option>
                              <option value="complex">Complex</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${
                                  row.designTier === "premium"
                                    ? "bg-amber-100 text-amber-800"
                                    : row.designTier === "high"
                                    ? "bg-orange-100 text-orange-800"
                                    : row.designTier === "medium"
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-stone-100 text-stone-600"
                                }`}
                              >
                                {row.designTier.charAt(0).toUpperCase() + row.designTier.slice(1)}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={1.3}
                                step={0.05}
                                value={row.designMultiplier}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  const mult = Number.isNaN(v) ? 1 : Math.min(1.3, Math.max(1, v));
                                  updateRow(row.signature, { designMultiplier: mult });
                                }}
                                className="w-16 px-1.5 py-1 text-xs border border-studio-border rounded bg-white text-studio-accent"
                                title="Override design multiplier (1.0–1.3)"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${
                                  row.motionTier === "advanced"
                                    ? "bg-violet-100 text-violet-800"
                                    : row.motionTier === "basic"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-stone-100 text-stone-600"
                                }`}
                              >
                                {row.motionTier.charAt(0).toUpperCase() + row.motionTier.slice(1)}
                              </span>
                              <span className="text-xs text-studio-muted">×{row.motionMultiplierSuggested}</span>
                              <label className="flex items-center gap-1.5 text-xs">
                                <input
                                  type="checkbox"
                                  checked={row.applyMotionMultiplier}
                                  onChange={(e) =>
                                    updateRow(row.signature, {
                                      applyMotionMultiplier: e.target.checked,
                                    })
                                  }
                                  className="rounded border-studio-border"
                                />
                                Apply to Dev
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={row.devHours || ""}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                handleDevHoursChange(row.signature, Number.isNaN(v) ? 0 : v);
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
                            />
                          </td>
                          <td className="px-4 py-2 text-studio-muted">
                            {(
                              row.devHours *
                              techMultiplier *
                              (row.designMultiplier ?? 1) *
                              (row.applyMotionMultiplier ? (row.motionMultiplierSuggested ?? 1) : 1)
                            ).toFixed(1)}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={row.qaHours ?? ""}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                updateRow(row.signature, {
                                  qaHours: Number.isNaN(v) ? 0 : Math.max(0, v),
                                });
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              placeholder="Notes…"
                              value={row.notes}
                              onChange={(e) =>
                                updateRow(row.signature, { notes: e.target.value })
                              }
                              className="w-full px-2 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent placeholder:text-studio-muted min-w-[120px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <footer className="border-t border-studio-border bg-studio-bg px-4 py-4 flex flex-wrap gap-8">
                <div>
                  <span className="text-xs text-studio-muted uppercase tracking-wide">Base dev hours</span>
                  <div className="text-lg font-semibold text-studio-accent">{totals.totalBaseDev.toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-xs text-studio-muted uppercase tracking-wide">
                    Adjusted dev (tech × design)
                  </span>
                  <div className="text-lg font-semibold text-studio-accent">{totals.totalAdjustedDev.toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-xs text-studio-muted uppercase tracking-wide">Total QA hours</span>
                  <div className="text-lg font-semibold text-studio-accent">{totals.totalQA.toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-xs text-studio-muted uppercase tracking-wide">Grand total</span>
                  <div className="text-xl font-semibold text-studio-accent">{totals.grandTotal.toFixed(1)} h</div>
                </div>
              </footer>
            </div>
          </>
        )}

        {report && rows.length === 0 && !error && (
          <p className="text-studio-muted">No components in report.</p>
        )}
      </div>
    </main>
  );
}
