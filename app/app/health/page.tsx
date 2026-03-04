import Link from "next/link";
import { prisma } from "@/src/lib/db";
import fs from "fs";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const ANALYZER_SCRIPT = path.join(
  REPO_ROOT,
  "analyzer-engine",
  "site-analyzer",
  "analyze-site.mjs"
);
const ARTIFACTS_DIR = path.join(REPO_ROOT, "artifacts");

interface Check {
  name: string;
  ok: boolean;
  message: string;
}

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  try {
    await prisma.$connect();
    checks.push({ name: "DB", ok: true, message: "OK" });
  } catch (err) {
    checks.push({
      name: "DB",
      ok: false,
      message: err instanceof Error ? err.message : "Connection failed",
    });
  }

  try {
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    }
    const testFile = path.join(ARTIFACTS_DIR, ".health-check");
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    checks.push({ name: "Artifacts folder", ok: true, message: "Writable" });
  } catch (err) {
    checks.push({
      name: "Artifacts folder",
      ok: false,
      message: err instanceof Error ? err.message : "Not writable",
    });
  }

  const analyzerExists = fs.existsSync(ANALYZER_SCRIPT);
  checks.push({
    name: "Analyzer path",
    ok: analyzerExists,
    message: analyzerExists ? "Exists" : `Missing: ${ANALYZER_SCRIPT}`,
  });

  return checks;
}

export default async function HealthPage() {
  const checks = await runChecks();
  const allOk = checks.every((c) => c.ok);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-light text-studio-accent">
          Health Check
        </h1>
        <div
          className={`rounded-lg border p-4 ${
            allOk
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="text-sm font-medium mb-2">
            {allOk ? "All systems OK" : "Some checks failed"}
          </div>
          <ul className="space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.name} className="flex justify-between gap-4">
                <span className="text-studio-accent">{c.name}</span>
                <span className={c.ok ? "text-green-700" : "text-amber-700"}>
                  {c.ok ? "✓" : "✗"} {c.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/"
          className="block text-sm text-studio-muted hover:text-studio-accent"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
