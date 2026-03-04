import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const ANALYZER_DIR = path.join(REPO_ROOT, "analyzer-engine", "site-analyzer");
const ANALYZER_SCRIPT = path.join(ANALYZER_DIR, "analyze-site.mjs");

export interface RunProgress {
  logs: string[];
  phase?: string;
  current?: number;
  total?: number;
  aiEnabled?: boolean;
  probeEnabled?: boolean;
}

export function getArtifactsDir(projectId: string): string {
  return path.join(REPO_ROOT, "artifacts", projectId);
}

function ensureArtifactsDir(projectId: string): void {
  const dir = getArtifactsDir(projectId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function findInDir(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const found = findInDir(full, filename);
      if (found) return found;
    } else if (e.name === filename) {
      return full;
    }
  }
  return null;
}

export function findAnalysisArtifacts(projectId: string): {
  jsonPath: string | null;
  htmlPath: string | null;
} {
  const base = getArtifactsDir(projectId);
  const jsonPath = findInDir(base, "site-report.json");
  const htmlPath = findInDir(base, "report.html");
  return { jsonPath, htmlPath };
}

function parseProgressFromLine(line: string): Partial<RunProgress> {
  const out: Partial<RunProgress> = {};
  const m = line.match(/\[(\d+)\/(\d+)\]/);
  if (m) {
    out.current = parseInt(m[1], 10);
    out.total = parseInt(m[2], 10);
  }
  if (line.includes("discovered") || line.includes("Discovered")) out.phase = "discovery";
  if (line.includes("crawl") || line.includes("Crawl")) out.phase = "crawl";
  if (line.includes("SITE ESTIMATION")) out.phase = "done";
  return out;
}

export interface RunOptions {
  projectId: string;
  url: string;
  aiEnabled?: boolean;
  probeEnabled?: boolean;
  onLog: (line: string) => void;
  onProgress: (progress: RunProgress) => void;
}

export function runAnalyzer(options: RunOptions): Promise<{ exitCode: number }> {
  const { projectId, url, aiEnabled = false, probeEnabled = false, onLog, onProgress } = options;
  ensureArtifactsDir(projectId);
  const outArg = path.relative(ANALYZER_DIR, path.join(REPO_ROOT, "artifacts", projectId));

  const args: string[] = [ANALYZER_SCRIPT, url, "--out", outArg];
  if (aiEnabled) {
    args.push("--ai-enrichment");
  } else {
    args.push("--no-llm");
  }
  if (probeEnabled) {
    args.push("--probe-interactions");
  }

  return new Promise((resolve) => {
    const child = spawn("node", args, {
      cwd: ANALYZER_DIR,
      env: { ...process.env },
    });

    const logs: string[] = [];
    let lastProgress: RunProgress = { logs: [] };

    function flush() {
      lastProgress = { ...lastProgress, logs: [...logs] };
      onProgress(lastProgress);
    }

    function addLog(data: string) {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        logs.push(line);
        const parsed = parseProgressFromLine(line);
        if (parsed.current !== undefined) lastProgress.current = parsed.current;
        if (parsed.total !== undefined) lastProgress.total = parsed.total;
        if (parsed.phase) lastProgress.phase = parsed.phase;
        onLog(line);
      }
      flush();
    }

    child.stdout.on("data", (d) => addLog(d.toString()));
    child.stderr.on("data", (d) => addLog(d.toString()));

    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1 });
    });
  });
}
