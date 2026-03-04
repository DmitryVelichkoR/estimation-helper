"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdaptedAnalysis } from "@/src/lib/analysisAdapter";
import { computeTotals, type Override } from "@/src/lib/estimationTotals";

interface EstimationPanelProps {
  projectId: string;
  analysis: AdaptedAnalysis;
}

interface OverrideRow {
  id: string;
  targetType: string;
  targetId: string;
  devHours: number | null;
  qaHours: number | null;
  notes: string | null;
}

function fmtHours(v: number): string {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

export function EstimationPanel({ projectId, analysis }: EstimationPanelProps) {
  const [tab, setTab] = useState<"family" | "component">("family");
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [familyId, setFamilyId] = useState("");
  const [componentId, setComponentId] = useState("");
  const [devHours, setDevHours] = useState("");
  const [qaHours, setQaHours] = useState("");
  const [notes, setNotes] = useState("");

  const fetchOverrides = useCallback(async () => {
    const res = await fetch(`/api/estimates/${projectId}/overrides`);
    if (res.ok) {
      const data = await res.json();
      setOverrides(data);
    }
  }, [projectId]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const overrideList: Override[] = overrides.map((o) => ({
    targetType: o.targetType as "FAMILY" | "COMPONENT",
    targetId: o.targetId,
    devHours: o.devHours,
    qaHours: o.qaHours,
  }));

  const totals = computeTotals(analysis, overrideList);

  async function applyFamily() {
    if (!familyId.trim()) return;
    const res = await fetch(`/api/estimates/${projectId}/overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "FAMILY",
        targetId: familyId.trim(),
        devHours: devHours ? parseFloat(devHours) : null,
        qaHours: qaHours ? parseFloat(qaHours) : null,
        notes: notes.trim() || null,
      }),
    });
    if (res.ok) {
      await fetchOverrides();
    }
  }

  async function applyComponent() {
    if (!componentId.trim()) return;
    const res = await fetch(`/api/estimates/${projectId}/overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "COMPONENT",
        targetId: componentId.trim(),
        devHours: devHours ? parseFloat(devHours) : null,
        qaHours: qaHours ? parseFloat(qaHours) : null,
        notes: notes.trim() || null,
      }),
    });
    if (res.ok) {
      await fetchOverrides();
    }
  }

  function setQaFromDev(ratio: number) {
    const d = parseFloat(devHours);
    if (!Number.isNaN(d)) setQaHours(String(d * ratio));
  }

  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  function toggleFamily(fid: string) {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid);
      else next.add(fid);
      return next;
    });
  }

  return (
    <div className="w-80 shrink-0 max-h-[32rem] rounded-lg border border-studio-border bg-studio-surface overflow-hidden flex flex-col">
      <div className="flex shrink-0 border-b border-studio-border">
        <button
          onClick={() => setTab("family")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            tab === "family"
              ? "bg-studio-accent text-white"
              : "text-studio-muted hover:bg-studio-bg"
          }`}
        >
          Family estimate
        </button>
        <button
          onClick={() => setTab("component")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            tab === "component"
              ? "bg-studio-accent text-white"
              : "text-studio-muted hover:bg-studio-bg"
          }`}
        >
          Component override
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 pb-6">
        {tab === "family" ? (
          <>
            <div>
              <label className="block text-xs text-studio-muted mb-1">Family ID</label>
              <select
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
              >
                <option value="">Select family…</option>
                {analysis.families.map((f) => (
                  <option key={f.familyId} value={f.familyId}>
                    {f.label} ({f.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-studio-muted mb-1">Dev hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={devHours}
                onChange={(e) => setDevHours(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-studio-muted mb-1">QA hours</label>
              <div className="flex gap-1 mb-1">
                <button
                  type="button"
                  onClick={() => setQaFromDev(0.5)}
                  className="px-2 py-1 text-xs border border-studio-border rounded hover:bg-studio-bg"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setQaFromDev(0.6)}
                  className="px-2 py-1 text-xs border border-studio-border rounded hover:bg-studio-bg"
                >
                  60%
                </button>
                <button
                  type="button"
                  onClick={() => setQaFromDev(0.8)}
                  className="px-2 py-1 text-xs border border-studio-border rounded hover:bg-studio-bg"
                >
                  80%
                </button>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                value={qaHours}
                onChange={(e) => setQaHours(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-studio-muted mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent resize-none"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs text-studio-muted mb-1">Component (signature)</label>
              <select
                value={componentId}
                onChange={(e) => setComponentId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
              >
                <option value="">Select component…</option>
                {analysis.components.map((c) => (
                  <option key={c.signature} value={c.signature}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-studio-muted mb-1">Dev hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={devHours}
                onChange={(e) => setDevHours(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-studio-muted mb-1">QA hours</label>
              <div className="flex gap-1 mb-1">
                <button
                  type="button"
                  onClick={() => setQaFromDev(0.5)}
                  className="px-2 py-1 text-xs border border-studio-border rounded hover:bg-studio-bg"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setQaFromDev(0.6)}
                  className="px-2 py-1 text-xs border border-studio-border rounded hover:bg-studio-bg"
                >
                  60%
                </button>
                <button
                  type="button"
                  onClick={() => setQaFromDev(0.8)}
                  className="px-2 py-1 text-xs border border-studio-border rounded hover:bg-studio-bg"
                >
                  80%
                </button>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                value={qaHours}
                onChange={(e) => setQaHours(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-studio-muted mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-studio-border rounded bg-white text-studio-accent resize-none"
              />
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 p-4 border-t border-studio-border bg-studio-surface shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        {tab === "family" ? (
          <button
            onClick={applyFamily}
            disabled={!familyId.trim()}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-studio-accent rounded hover:bg-stone-600 disabled:opacity-50"
          >
            Apply to family
          </button>
        ) : (
          <button
            onClick={applyComponent}
            disabled={!componentId.trim()}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-studio-accent rounded hover:bg-stone-600 disabled:opacity-50"
          >
            Apply to component
          </button>
        )}
      </div>

      <div className="shrink-0 p-4 border-t border-studio-border space-y-3">
        <div>
          <div className="text-xs text-studio-muted">Total Dev</div>
          <div className="text-lg font-medium text-studio-accent">{fmtHours(totals.totalDev)} h</div>
        </div>
        <div>
          <div className="text-xs text-studio-muted">Total QA</div>
          <div className="text-lg font-medium text-studio-accent">{fmtHours(totals.totalQA)} h</div>
        </div>
        <div>
          <div className="text-xs text-studio-muted mb-1">By family</div>
          <div className="space-y-1">
            {totals.byFamily.map((f) => (
              <div key={f.familyId} className="text-sm">
                <button
                  type="button"
                  onClick={() => toggleFamily(f.familyId)}
                  className="flex items-center gap-1 w-full text-left hover:bg-studio-bg rounded px-1 py-0.5"
                >
                  <span className="text-studio-muted">
                    {expandedFamilies.has(f.familyId) ? "▼" : "▶"}
                  </span>
                  <span className="truncate">{f.label}</span>
                  <span className="text-studio-muted shrink-0">
                    {fmtHours(f.devHours)} / {fmtHours(f.qaHours)}
                  </span>
                </button>
                {expandedFamilies.has(f.familyId) && (
                  <div className="ml-4 text-xs text-studio-muted">
                    {f.componentCount} components
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
