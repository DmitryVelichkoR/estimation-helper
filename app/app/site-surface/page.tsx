"use client";

import { useState } from "react";
import Link from "next/link";
import { loadSiteReport } from "@/src/lib/siteReport";
import { SiteSurfaceCard } from "@/src/components/SiteSurfaceCard";

export default function SiteSurfaceDemoPage() {
  const [report, setReport] = useState<ReturnType<typeof loadSiteReport> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setReport(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        const parsed = loadSiteReport(json);
        setReport(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse JSON");
      }
    };
    reader.readAsText(file);
  }

  return (
    <main>
      <header className="border-b border-studio-border bg-studio-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-medium text-studio-accent"
          >
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
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        <h1 className="text-2xl font-light text-studio-accent">
          Site surface demo
        </h1>
        <p className="text-studio-muted">
          Upload a site-report.json to view site surface metrics.
        </p>

        <div className="mb-6">
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
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-6">
            <SiteSurfaceCard report={report} />

            <div className="rounded-lg border border-studio-border bg-studio-surface p-4">
              <h3 className="text-sm font-medium text-studio-accent mb-2">
                Summary
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-studio-muted">
                  Unique components:{" "}
                  <span className="font-medium text-studio-accent">
                    {report.uniqueComponents}
                  </span>
                </span>
                <span className="text-studio-muted">
                  Families:{" "}
                  <span className="font-medium text-studio-accent">
                    {report.familiesCount}
                  </span>
                </span>
                <span className="text-studio-muted">
                  Confidence:{" "}
                  <span className="font-medium text-studio-accent">
                    {report.confidencePercent}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
