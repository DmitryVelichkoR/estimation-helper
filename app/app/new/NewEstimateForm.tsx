"use client";

import { useState } from "react";
import { techProfiles, getTechProfile, buildTechConfig } from "@/src/lib/techProfiles";

interface NewEstimateFormProps {
  createProject: (formData: FormData) => Promise<void>;
}

export function NewEstimateForm({ createProject }: NewEstimateFormProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [cmsComplexity, setCmsComplexity] = useState(0.5);
  const [hostingCiComplexity, setHostingCiComplexity] = useState(0.5);
  const [themeTemplateComplexity, setThemeTemplateComplexity] = useState(0.5);

  const profile = selectedKey ? getTechProfile(selectedKey) : null;

  function handleSelectProfile(key: string) {
    const p = getTechProfile(key);
    if (p) {
      setSelectedKey(key);
      setCmsComplexity(p.defaults.cmsComplexity ?? 0.5);
      setHostingCiComplexity(p.defaults.hostingCiComplexity ?? 0.5);
      setThemeTemplateComplexity(p.defaults.themeTemplateComplexity ?? 0.5);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const key = selectedKey ?? "custom";
    const p = getTechProfile(key) ?? techProfiles.find((t) => t.key === "custom")!;
    const config = buildTechConfig(p, {
      cmsComplexity,
      hostingCiComplexity,
      themeTemplateComplexity,
    });
    formData.set("techKey", key);
    formData.set("techConfigJson", JSON.stringify(config));
    await createProject(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-studio-border bg-studio-surface p-8 space-y-8"
    >
      <div>
        <label className="block text-sm font-medium text-studio-accent mb-3">
          Site URL
        </label>
        <input
          name="url"
          type="url"
          required
          placeholder="https://example.com"
          className="w-full px-4 py-2 border border-studio-border rounded-lg bg-white text-studio-accent placeholder:text-studio-muted focus:outline-none focus:ring-2 focus:ring-studio-accent/20 focus:border-studio-accent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-studio-accent mb-3">
          Tech profile
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {techProfiles.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handleSelectProfile(p.key)}
              className={`text-left p-4 rounded-lg border transition-colors ${
                selectedKey === p.key
                  ? "border-studio-accent bg-studio-accent/5"
                  : "border-studio-border hover:border-studio-muted"
              }`}
            >
              <span className="block font-medium text-studio-accent">{p.name}</span>
              <span className="block text-sm text-studio-muted mt-1">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {profile && (
        <div className="space-y-4 pt-4 border-t border-studio-border">
          <label className="block text-sm font-medium text-studio-accent">
            Complexity sliders
          </label>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-studio-muted">CMS complexity</span>
                <span className="text-studio-accent">{Math.round(cmsComplexity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={cmsComplexity}
                onChange={(e) => setCmsComplexity(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none bg-studio-border accent-studio-accent"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-studio-muted">Hosting / CI complexity</span>
                <span className="text-studio-accent">{Math.round(hostingCiComplexity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={hostingCiComplexity}
                onChange={(e) => setHostingCiComplexity(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none bg-studio-border accent-studio-accent"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-studio-muted">Theme / template complexity</span>
                <span className="text-studio-accent">{Math.round(themeTemplateComplexity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={themeTemplateComplexity}
                onChange={(e) => setThemeTemplateComplexity(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none bg-studio-border accent-studio-accent"
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="px-6 py-2 text-white bg-studio-accent hover:bg-stone-600 rounded-lg transition-colors"
      >
        Create estimate
      </button>
    </form>
  );
}
