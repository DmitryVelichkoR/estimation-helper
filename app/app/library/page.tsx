"use client";

import { useState } from "react";
import Link from "next/link";

type Complexity = "simple" | "medium" | "complex";

interface FamilyMember {
  signature: string;
  label?: string;
  seenCount?: number;
  previewDataUrl?: string | null;
  complexityHint?: string | null;
}

interface LibraryFamily {
  id: string;
  name: string;
  description: string;
  members: FamilyMember[];
  pagesUsed: number;
  defaultDevHours: number;
  defaultQaHours: number;
  complexity: Complexity;
}

interface ComponentOverrides {
  [signature: string]: {
    devHours: number;
    qaHours: number;
    complexity: Complexity;
    label?: string;
    description?: string;
  };
}

function fmt(v: number | null | undefined): string {
  return v != null ? String(v) : "—";
}

export default function LibraryPage() {
  const [families, setFamilies] = useState<LibraryFamily[]>([]);
  const [componentOverrides, setComponentOverrides] = useState<ComponentOverrides>({});
  const [editingFamily, setEditingFamily] = useState<LibraryFamily | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    devHours: 0,
    qaHours: 0,
    complexity: "simple" as Complexity,
  });
  const [error, setError] = useState<string | null>(null);
  const [rawReport, setRawReport] = useState<Record<string, unknown> | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setFamilies([]);
    setComponentOverrides({});
    setRawReport(null);
    setEditingFamily(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as Record<string, unknown>;
        const rawFamilies = Array.isArray(json.families) ? json.families : [];
        const rawLibrary = Array.isArray(json.componentLibrary) ? json.componentLibrary : [];

        const parsed: LibraryFamily[] = rawFamilies.map((f: unknown) => {
          const obj = f as Record<string, unknown>;
          const members = (Array.isArray(obj.members) ? obj.members : []) as Record<string, unknown>[];
          const memberSignatures = (Array.isArray(obj.memberSignatures) ? obj.memberSignatures : []) as string[];
          const sigs =
            memberSignatures.length > 0
              ? memberSignatures
              : members.map((m) => String((m as Record<string, unknown>)?.signature ?? ""));
          const memberList: FamilyMember[] = sigs.filter(Boolean).map((sig) => {
            const raw = rawLibrary.find((r: unknown) => (r as Record<string, unknown>)?.signature === sig) as Record<string, unknown> | undefined;
            const member = members.find((m) => (m as Record<string, unknown>)?.signature === sig) as Record<string, unknown> | undefined;
            const m = member ?? raw;
            const canon = (m?.canonicalSummary ?? {}) as Record<string, unknown>;
            return {
              signature: String(sig),
              label: (m?.label ?? canon?.rootTag) as string | undefined,
              seenCount: Number(m?.seenCount ?? 0),
              previewDataUrl: (m?.previewDataUrl ?? raw?.previewDataUrl) as string | undefined,
              complexityHint: (m?.complexityHint as Record<string, unknown>)?.level as string | undefined,
            };
          });
          const pagesUsed = memberList.reduce((s, m) => s + (m.seenCount ?? 0), 0);
          const defaultDevHours = 0;
          const defaultQaHours = defaultDevHours * 0.5;
          const hint = (memberList[0]?.complexityHint ?? "").toLowerCase();
          const complexity: Complexity =
            hint === "medium" ? "medium" : hint === "complex" ? "complex" : "simple";
          return {
            id: String(obj.familyId ?? obj.id ?? ""),
            name: String(obj.name ?? obj.label ?? "Unnamed"),
            description: String(obj.reason ?? obj.description ?? ""),
            members: memberList,
            pagesUsed,
            defaultDevHours,
            defaultQaHours,
            complexity,
          };
        });
        setFamilies(parsed);
        setRawReport(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse JSON");
      }
    };
    reader.readAsText(file);
  }

  function openEditor(family: LibraryFamily) {
    setEditingFamily(family);
    setEditForm({
      name: family.name,
      description: family.description,
      devHours: family.defaultDevHours,
      qaHours: family.defaultQaHours,
      complexity: family.complexity,
    });
  }

  function handleSave() {
    if (!editingFamily) return;
    const { name, description, devHours, qaHours, complexity } = editForm;

    setFamilies((prev) =>
      prev.map((f) =>
        f.id === editingFamily.id
          ? {
              ...f,
              name,
              description,
              defaultDevHours: devHours,
              defaultQaHours: qaHours,
              complexity,
            }
          : f
      )
    );

    const newOverrides: ComponentOverrides = { ...componentOverrides };
    for (const m of editingFamily.members) {
      newOverrides[m.signature] = {
        ...newOverrides[m.signature],
        devHours,
        qaHours,
        complexity,
        label: name,
        description,
      };
    }
    setComponentOverrides(newOverrides);
    setEditingFamily(null);
  }

  function getPreviewForFamily(family: LibraryFamily): string | null {
    const first = family.members[0];
    return first?.previewDataUrl ?? null;
  }

  function handleExport() {
    if (!rawReport) return;
    const library = Array.isArray(rawReport.componentLibrary) ? [...rawReport.componentLibrary] : [];
    const modifiedLibrary = library.map((c: unknown) => {
      const obj = c as Record<string, unknown>;
      const sig = obj.signature as string;
      const ov = componentOverrides[sig];
      if (!ov) return obj;
      return {
        ...obj,
        label: ov.label ?? obj.label,
        devHours: ov.devHours,
        qaHours: ov.qaHours,
        complexityHint: { ...((obj.complexityHint as object) ?? {}), level: ov.complexity },
      };
    });
    const blob = new Blob(
      [JSON.stringify({ ...rawReport, componentLibrary: modifiedLibrary }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "site-report-modified.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="border-b border-studio-border bg-studio-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-medium text-studio-accent">
            Estimation Studio
          </Link>
          <nav className="flex gap-6">
            <Link href="/app/estimates" className="text-studio-muted hover:text-studio-accent transition-colors">
              Estimates
            </Link>
            <Link href="/app/new" className="text-studio-muted hover:text-studio-accent transition-colors">
              New
            </Link>
            <Link href="/app/estimate" className="text-studio-muted hover:text-studio-accent transition-colors">
              Estimate
            </Link>
            <Link href="/app/library" className="text-studio-muted hover:text-studio-accent transition-colors">
              Library
            </Link>
            <Link href="/app/site-surface" className="text-studio-muted hover:text-studio-accent transition-colors">
              Site surface
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        <h1 className="text-2xl font-light text-studio-accent">
          Component library
        </h1>
        <p className="text-studio-muted">
          Edit component families. Changes apply to all members.
        </p>

        <div className="mb-8">
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
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {families.length > 0 && (
          <>
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={handleExport}
                disabled={!rawReport}
                className="px-4 py-2 text-sm font-medium text-white bg-studio-accent hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                Export modified report
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => {
              const preview = getPreviewForFamily(family);
              const memberCount = family.members.length;
              return (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => openEditor(family)}
                  className="text-left rounded-xl border border-studio-border bg-studio-surface overflow-hidden hover:border-studio-muted transition-colors"
                >
                  <div className="aspect-video bg-studio-border flex items-center justify-center">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-studio-muted text-sm">No preview</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-studio-accent truncate">
                      {family.name}
                    </h3>
                    <div className="mt-2 flex gap-4 text-sm text-studio-muted">
                      <span>{memberCount} members</span>
                      <span>{fmt(family.pagesUsed)} pages</span>
                    </div>
                    {family.defaultDevHours > 0 || family.defaultQaHours > 0 ? (
                      <div className="mt-1 text-xs text-studio-muted">
                        {family.defaultDevHours}h dev · {family.defaultQaHours}h QA
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          </>
        )}

        {editingFamily && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setEditingFamily(null)}
          >
            <div
              className="rounded-xl border border-studio-border bg-studio-surface p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-medium text-studio-accent mb-4">
                Edit family
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-studio-accent mb-1">
                    Component name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-studio-border rounded-lg bg-white text-studio-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-studio-accent mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-studio-border rounded-lg bg-white text-studio-accent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-studio-accent mb-1">
                    Complexity
                  </label>
                  <select
                    value={editForm.complexity}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, complexity: e.target.value as Complexity }))
                    }
                    className="w-full px-3 py-2 text-sm border border-studio-border rounded-lg bg-white text-studio-accent"
                  >
                    <option value="simple">Simple</option>
                    <option value="medium">Medium</option>
                    <option value="complex">Complex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-studio-accent mb-1">
                    Dev hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={editForm.devHours || ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      const devHours = Number.isNaN(v) ? 0 : Math.max(0, v);
                      setEditForm((f) => ({
                        ...f,
                        devHours,
                        qaHours: f.qaHours === f.devHours * 0.5 ? devHours * 0.5 : f.qaHours,
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-studio-border rounded-lg bg-white text-studio-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-studio-accent mb-1">
                    QA hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={editForm.qaHours ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setEditForm((f) => ({
                        ...f,
                        qaHours: Number.isNaN(v) ? 0 : Math.max(0, v),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-studio-border rounded-lg bg-white text-studio-accent"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingFamily(null)}
                  className="px-4 py-2 text-sm font-medium text-studio-muted hover:text-studio-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-studio-accent hover:bg-stone-600 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
