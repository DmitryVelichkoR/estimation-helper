"use client";

import { useState, useEffect, useCallback } from "react";
import { EstimationWorkspace } from "./EstimationWorkspace";
import { SiteSurfaceCard } from "@/src/components/SiteSurfaceCard";
import type { AdaptedAnalysis } from "@/src/lib/analysisAdapter";
import type { ParsedSiteReport } from "@/src/lib/siteReport";

interface EstimateDetailProps {
  id: string;
  initialStatus: string;
}

interface ApiResponse {
  project: {
    status: string;
    analysisHtmlPath?: string | null;
    finalReportJsonPath?: string | null;
    finalReportHtmlPath?: string | null;
  };
  progress?: {
    logs?: string[];
    current?: number;
    total?: number;
    phase?: string;
    aiEnabled?: boolean;
    probeEnabled?: boolean;
  } | null;
  analysis?: AdaptedAnalysis | null;
  siteReport?: ParsedSiteReport | null;
}

export function EstimateDetail({ id, initialStatus }: EstimateDetailProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [probeEnabled, setProbeEnabled] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/estimates/${id}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const status = data?.project?.status ?? initialStatus;
  const isRunning = status === "RUNNING";

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, [isRunning, fetchData]);

  async function handleRun() {
    setRunning(true);
    try {
      const res = await fetch(`/api/estimates/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled, probeEnabled }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setRunning(false);
    }
  }

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/estimates/${id}/report`, { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setGenerating(false);
    }
  }

  const hasFinalReport = !!(
    data?.project?.finalReportHtmlPath &&
    data?.project?.finalReportJsonPath
  );

  const progress = data?.progress;
  const logs = (progress?.logs ?? []) as string[];
  const current = progress?.current;
  const total = progress?.total;

  useEffect(() => {
    if (progress?.aiEnabled !== undefined) setAiEnabled(progress.aiEnabled);
    if (progress?.probeEnabled !== undefined) setProbeEnabled(progress.probeEnabled);
  }, [progress?.aiEnabled, progress?.probeEnabled]);

  const runAiEnabled = progress?.aiEnabled ?? aiEnabled;
  const runProbeEnabled = progress?.probeEnabled ?? probeEnabled;

  return (
    <div className="space-y-8">
      {status !== "RUNNING" && (
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4 space-y-4">
          <h3 className="text-sm font-medium text-studio-accent">Analysis options</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-studio-border text-studio-accent focus:ring-studio-accent/20"
              />
              <span className="text-sm text-studio-accent">Use AI enrichment</span>
              <span className="text-xs text-studio-muted">(recommended)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={probeEnabled}
                onChange={(e) => setProbeEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-studio-border text-studio-accent focus:ring-studio-accent/20"
              />
              <span className="text-sm text-studio-accent">Interaction probe</span>
              <span className="text-xs text-studio-muted">(reveal hidden components)</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="text-studio-muted">Status:</span>
        <span
          className={`font-medium ${
            status === "DONE"
              ? "text-green-600"
              : status === "FAILED"
                ? "text-red-600"
                : status === "RUNNING"
                  ? "text-amber-600"
                  : "text-studio-accent"
          }`}
        >
          {status}
        </span>
        {(status === "DONE" || status === "FAILED") && (
          <span className="text-sm text-studio-muted">
            AI: {runAiEnabled ? "On" : "Off"} · Probe: {runProbeEnabled ? "On" : "Off"}
          </span>
        )}
        {status !== "RUNNING" && (
          <button
            onClick={handleRun}
            disabled={running}
            className="ml-4 px-4 py-2 text-sm font-medium text-white bg-studio-accent hover:bg-stone-600 rounded-lg disabled:opacity-50"
          >
            {running ? "Starting…" : "Run analysis"}
          </button>
        )}
      </div>

      {(current !== undefined || total !== undefined) && (
        <div className="text-sm text-studio-muted">
          Progress: {current ?? 0} / {total ?? "?"} URLs
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-studio-accent mb-2">Log</h3>
        <div className="rounded-lg border border-studio-border bg-studio-surface p-4 max-h-80 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <span className="text-studio-muted">No logs yet.</span>
          ) : (
            <pre className="whitespace-pre-wrap break-words text-studio-accent">
              {logs.join("\n")}
            </pre>
          )}
        </div>
      </div>

      {data?.analysis && status === "DONE" && (
        <>
          {data.siteReport && (
            <SiteSurfaceCard report={data.siteReport} />
          )}
          <div className="flex flex-wrap items-center gap-4">
            {data.project.analysisHtmlPath && (
              <a
                href={`/api/estimates/${id}/report`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-studio-muted hover:text-studio-accent"
              >
                View analysis report →
              </a>
            )}
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-white bg-studio-accent hover:bg-stone-600 rounded-lg disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate report"}
            </button>
            {hasFinalReport && (
              <>
                <a
                  href={`/api/estimates/${id}/file?path=final-report.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-studio-muted hover:text-studio-accent"
                >
                  Open final HTML
                </a>
                <a
                  href={`/api/estimates/${id}/file?path=final-report.json`}
                  download="final-report.json"
                  className="text-sm text-studio-muted hover:text-studio-accent"
                >
                  Download JSON
                </a>
              </>
            )}
          </div>
          <EstimationWorkspace projectId={id} analysis={data.analysis} />
        </>
      )}
    </div>
  );
}
