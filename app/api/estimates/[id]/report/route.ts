import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import fs from "fs";
import path from "path";
import { adaptAnalysis } from "@/src/lib/analysisAdapter";
import {
  buildFinalReport,
  renderFinalReportHtml,
} from "@/src/lib/finalReportGenerator";
import { getArtifactsDir } from "@/src/lib/analyzerRunner";

const REPO_ROOT = path.resolve(process.cwd(), "..");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.estimateProject.findUnique({ where: { id } });
  if (!project?.analysisHtmlPath) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  const htmlPath = path.isAbsolute(project.analysisHtmlPath)
    ? project.analysisHtmlPath
    : path.join(REPO_ROOT, project.analysisHtmlPath);
  if (!fs.existsSync(htmlPath)) {
    return NextResponse.json({ error: "Report file missing" }, { status: 404 });
  }
  const html = fs.readFileSync(htmlPath, "utf-8");
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.estimateProject.findUnique({
    where: { id },
    include: { manualOverrides: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!project.analysisJsonPath) {
    return NextResponse.json(
      { error: "No analysis data. Run analysis first." },
      { status: 400 }
    );
  }

  const jsonPath = path.isAbsolute(project.analysisJsonPath)
    ? project.analysisJsonPath
    : path.join(REPO_ROOT, project.analysisJsonPath);

  let rawAnalysis: Record<string, unknown>;
  try {
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: "Analysis file not found" },
        { status: 400 }
      );
    }
    rawAnalysis = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return NextResponse.json(
      { error: "Failed to read analysis" },
      { status: 500 }
    );
  }

  const analysis = adaptAnalysis(rawAnalysis);
  const overrides = project.manualOverrides.map((o) => ({
    targetType: o.targetType as "FAMILY" | "COMPONENT",
    targetId: o.targetId,
    devHours: o.devHours,
    qaHours: o.qaHours,
    notes: o.notes,
  }));

  const reportData = buildFinalReport(
    { url: project.url, techKey: project.techKey },
    analysis,
    overrides
  );

  const artifactsDir = getArtifactsDir(id);
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const finalJsonPath = path.join(artifactsDir, "final-report.json");
  const finalHtmlPath = path.join(artifactsDir, "final-report.html");

  fs.writeFileSync(finalJsonPath, JSON.stringify(reportData, null, 2), "utf-8");
  fs.writeFileSync(finalHtmlPath, renderFinalReportHtml(reportData), "utf-8");

  await prisma.estimateProject.update({
    where: { id },
    data: {
      finalReportJsonPath: finalJsonPath,
      finalReportHtmlPath: finalHtmlPath,
    },
  });

  return NextResponse.json({
    ok: true,
    finalReportJsonPath: finalJsonPath,
    finalReportHtmlPath: finalHtmlPath,
  });
}
