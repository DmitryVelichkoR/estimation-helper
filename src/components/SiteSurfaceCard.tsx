"use client";

import { useState } from "react";
import type { ParsedSiteReport } from "@/src/lib/siteReport";

interface SiteSurfaceCardProps {
  report: ParsedSiteReport;
}

function fmt(n: number): string {
  return n != null && !Number.isNaN(n) ? String(n) : "—";
}

export function SiteSurfaceCard({ report }: SiteSurfaceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const r = report;

  const fetchSuccess = r.urlsProcessed - r.urlsFailed - r.urlsSkipped;
  const hasSitemap = r.sitemapUrlsDiscovered > 0;
  const processedLabel = hasSitemap
    ? `${r.urlsProcessed} / ${r.sitemapUrlsDiscovered}`
    : `${r.urlsProcessed}`;

  return (
    <div className="rounded-xl border border-studio-border bg-studio-surface p-6">
      <h3 className="text-base font-medium text-studio-accent">
        Site surface
      </h3>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              Sitemap URLs discovered
            </span>
            <span className="font-medium text-studio-accent">
              {fmt(r.sitemapUrlsDiscovered)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              URLs processed
            </span>
            <span className="font-medium text-studio-accent">
              {processedLabel}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              Fetch success
            </span>
            <span className="font-medium text-studio-accent">
              {fmt(fetchSuccess)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">Failed</span>
            <span className="font-medium text-studio-accent">
              {fmt(r.urlsFailed)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">Skipped</span>
            <span className="font-medium text-studio-accent">
              {fmt(r.urlsSkipped)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              Effective unique pages
            </span>
            <span className="font-medium text-studio-accent">
              {fmt(r.effectiveUniquePages)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              Redirects detected
            </span>
            <span className="font-medium text-studio-accent">
              {fmt(r.redirectsDetected)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              Canonicals merged
            </span>
            <span className="font-medium text-studio-accent">
              {fmt(r.canonicalsMerged)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              Extra discovered by crawl
            </span>
            <span className="font-medium text-studio-accent">
              {r.extraDiscoveredByCrawl > 0 ? fmt(r.extraDiscoveredByCrawl) : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-studio-muted">
              Confidence
            </span>
            <span className="font-medium text-studio-accent">
              {fmt(r.confidencePercent)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-studio-border pt-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-left text-sm text-studio-muted hover:text-studio-accent"
        >
          <span>Why counts differ</span>
          <span className="text-studio-muted">
            {expanded ? "−" : "+"}
          </span>
        </button>
        {expanded && (
          <ul className="mt-2 space-y-1 text-sm text-studio-muted">
            <li>• Sitemap may be incomplete</li>
            <li>• Parameterized pages are usually not listed</li>
            <li>• Redirects/canonicals merge multiple URLs into one effective page</li>
            <li>• Crawl can discover additional pages not listed in sitemap</li>
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-studio-muted">
        Hours are estimated by unique components (not by number of pages). Page
        counts increase coverage and confidence, not hours directly.
      </p>
    </div>
  );
}
