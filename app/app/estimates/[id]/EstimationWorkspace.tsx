"use client";

import { useState, useMemo } from "react";
import type { AdaptedAnalysis } from "@/src/lib/analysisAdapter";
import { EstimationPanel } from "./EstimationPanel";

function fmt(v: number | null | undefined): string {
  return v != null ? String(v) : "—";
}

interface EstimationWorkspaceProps {
  projectId: string;
  analysis: AdaptedAnalysis;
}

export function EstimationWorkspace({ projectId, analysis }: EstimationWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [familySearch, setFamilySearch] = useState("");
  const [complexityFilter, setComplexityFilter] = useState<string>("");
  const [hasForm, setHasForm] = useState(false);
  const [hasCarousel, setHasCarousel] = useState(false);
  const [hasModal, setHasModal] = useState(false);
  const [hasScrollAnimation, setHasScrollAnimation] = useState(false);
  const [hasDropdown, setHasDropdown] = useState(false);

  const filteredFamilies = useMemo(() => {
    const q = familySearch.toLowerCase().trim();
    if (!q) return analysis.families;
    return analysis.families.filter(
      (f) =>
        f.familyId.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
    );
  }, [analysis.families, familySearch]);

  const filteredComponents = useMemo(() => {
    let list = analysis.components;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.signature.toLowerCase().includes(q) ||
          c.label.toLowerCase().includes(q) ||
          (c.firstSeenUrl ?? "").toLowerCase().includes(q)
      );
    }
    if (complexityFilter) {
      list = list.filter(
        (c) => (c.complexityHint ?? "").toLowerCase() === complexityFilter.toLowerCase()
      );
    }
    if (hasForm) list = list.filter((c) => c.hasForm);
    if (hasCarousel) list = list.filter((c) => c.hasCarousel);
    if (hasModal) list = list.filter((c) => c.hasModal);
    if (hasScrollAnimation) list = list.filter((c) => c.hasScrollAnimation);
    if (hasDropdown) list = list.filter((c) => c.hasDropdown);
    return list;
  }, [
    analysis.components,
    search,
    complexityFilter,
    hasForm,
    hasCarousel,
    hasModal,
    hasScrollAnimation,
    hasDropdown,
  ]);

  const k = analysis.kpis;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4">
          <div className="text-xs text-studio-muted uppercase tracking-wide">URLs discovered</div>
          <div className="text-xl font-medium text-studio-accent mt-1">{fmt(k.urlsDiscovered)}</div>
        </div>
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4">
          <div className="text-xs text-studio-muted uppercase tracking-wide">URLs analyzed</div>
          <div className="text-xl font-medium text-studio-accent mt-1">{fmt(k.urlsAnalyzed)}</div>
        </div>
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4">
          <div className="text-xs text-studio-muted uppercase tracking-wide">URLs failed</div>
          <div className="text-xl font-medium text-studio-accent mt-1">{fmt(k.urlsFailed)}</div>
        </div>
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4">
          <div className="text-xs text-studio-muted uppercase tracking-wide">Unique components</div>
          <div className="text-xl font-medium text-studio-accent mt-1">{fmt(k.uniqueComponents)}</div>
        </div>
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4">
          <div className="text-xs text-studio-muted uppercase tracking-wide">Families</div>
          <div className="text-xl font-medium text-studio-accent mt-1">{fmt(k.families)}</div>
        </div>
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4">
          <div className="text-xs text-studio-muted uppercase tracking-wide">Confidence</div>
          <div className="text-xl font-medium text-studio-accent mt-1">
            {k.confidence != null ? `${Math.round(k.confidence * 100)}%` : "—"}
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <aside className="w-56 shrink-0 flex flex-col">
          <div className="rounded-lg border border-studio-border bg-studio-surface p-4 sticky top-4">
            <h3 className="text-sm font-medium text-studio-accent mb-2">Families</h3>
            <input
              type="text"
              placeholder="Search families…"
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent placeholder:text-studio-muted mb-3"
            />
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {filteredFamilies.map((f) => (
                <li key={f.familyId} className="text-sm">
                  <span className="text-studio-accent">{f.label}</span>
                  <span className="text-studio-muted ml-1">({f.count})</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-studio-border bg-studio-surface p-4 mb-4 space-y-3">
            <h3 className="text-sm font-medium text-studio-accent">Filters</h3>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search by URL or signature…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent placeholder:text-studio-muted min-w-[200px]"
              />
              <select
                value={complexityFilter}
                onChange={(e) => setComplexityFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
              >
                <option value="">All complexity</option>
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-studio-muted">
                <input type="checkbox" checked={hasForm} onChange={(e) => setHasForm(e.target.checked)} />
                hasForm
              </label>
              <label className="flex items-center gap-2 text-sm text-studio-muted">
                <input type="checkbox" checked={hasCarousel} onChange={(e) => setHasCarousel(e.target.checked)} />
                hasCarousel
              </label>
              <label className="flex items-center gap-2 text-sm text-studio-muted">
                <input type="checkbox" checked={hasModal} onChange={(e) => setHasModal(e.target.checked)} />
                hasModal
              </label>
              <label className="flex items-center gap-2 text-sm text-studio-muted">
                <input type="checkbox" checked={hasScrollAnimation} onChange={(e) => setHasScrollAnimation(e.target.checked)} />
                hasScrollAnimation
              </label>
              <label className="flex items-center gap-2 text-sm text-studio-muted">
                <input type="checkbox" checked={hasDropdown} onChange={(e) => setHasDropdown(e.target.checked)} />
                hasDropdown
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-studio-border bg-studio-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-studio-border bg-studio-bg">
                    <th className="text-left px-4 py-3 font-medium text-studio-accent">Preview</th>
                    <th className="text-left px-4 py-3 font-medium text-studio-accent">Label</th>
                    <th className="text-left px-4 py-3 font-medium text-studio-accent">Family</th>
                    <th className="text-left px-4 py-3 font-medium text-studio-accent">Complexity</th>
                    <th className="text-left px-4 py-3 font-medium text-studio-accent">Seen</th>
                    <th className="text-left px-4 py-3 font-medium text-studio-accent">First seen URL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComponents.map((c) => {
                    const previewUrl = (c as { previewUrl?: string }).previewUrl;
                    return (
                    <tr key={c.signature} className="border-b border-studio-border last:border-0">
                      <td className="px-4 py-2">
                        {previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt=""
                            className="w-16 h-12 object-cover rounded bg-studio-border"
                          />
                        ) : (
                          <span className="text-studio-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-studio-accent">{c.label}</td>
                      <td className="px-4 py-2 text-studio-muted">{c.familyId ?? "—"}</td>
                      <td className="px-4 py-2 text-studio-muted">{c.complexityHint ?? "—"}</td>
                      <td className="px-4 py-2 text-studio-muted">{fmt(c.seenCount)}</td>
                      <td className="px-4 py-2 text-studio-muted truncate max-w-[200px]" title={c.firstSeenUrl ?? ""}>
                        {c.firstSeenUrl ?? "—"}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <EstimationPanel projectId={projectId} analysis={analysis} />
      </div>
    </div>
  );
}
