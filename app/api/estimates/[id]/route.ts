import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import fs from "fs";
import path from "path";
import { adaptAnalysis } from "@/src/lib/analysisAdapter";
import { loadSiteReport } from "@/src/lib/siteReport";
import { getArtifactsDir } from "@/src/lib/analyzerRunner";

const REPO_ROOT = path.resolve(process.cwd(), "..");

function addPreviewUrls(
  analysis: { components: { previewPath: string | null }[] },
  projectId: string
) {
  const base = getArtifactsDir(projectId);
  for (const c of analysis.components) {
    const p = c.previewPath;
    if (!p || p === "data") continue;
    const normBase = path.normalize(base);
    const normP = path.normalize(p);
    if (normP.startsWith(normBase)) {
      const rel = path.relative(base, p);
      if (rel && !rel.startsWith("..")) {
        (c as { previewUrl?: string }).previewUrl = `/api/estimates/${projectId}/file?path=${encodeURIComponent(rel)}`;
      }
    } else if (!p.startsWith("http") && !p.startsWith("data") && !path.isAbsolute(p)) {
      (c as { previewUrl?: string }).previewUrl = `/api/estimates/${projectId}/file?path=${encodeURIComponent(p)}`;
    }
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.estimateProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let progress: Record<string, unknown> | null = null;
  if (project.progressJson) {
    try {
      progress = JSON.parse(project.progressJson) as Record<string, unknown>;
    } catch {
      progress = { logs: [project.progressJson] };
    }
  }

  let analysis: unknown = null;
  let siteReport: ReturnType<typeof loadSiteReport> | null = null;
  if (project.analysisJsonPath) {
    const jsonPath = path.isAbsolute(project.analysisJsonPath)
      ? project.analysisJsonPath
      : path.join(REPO_ROOT, project.analysisJsonPath);
    try {
      if (fs.existsSync(jsonPath)) {
        const raw = JSON.parse(
          fs.readFileSync(jsonPath, "utf-8")
        ) as Record<string, unknown>;
        analysis = adaptAnalysis(raw);
        addPreviewUrls(analysis as { components: { previewPath: string | null }[] }, id);
        siteReport = loadSiteReport(raw);
      }
    } catch {
      // ignore parse errors
    }
  }

  return NextResponse.json({
    project: {
      id: project.id,
      url: project.url,
      techKey: project.techKey,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      artifactsDir: project.artifactsDir,
      analysisJsonPath: project.analysisJsonPath,
      analysisHtmlPath: project.analysisHtmlPath,
      finalReportJsonPath: project.finalReportJsonPath,
      finalReportHtmlPath: project.finalReportHtmlPath,
    },
    progress,
    analysis,
    siteReport,
  });
}
