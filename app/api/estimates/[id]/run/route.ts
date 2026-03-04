import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import {
  runAnalyzer,
  findAnalysisArtifacts,
  type RunProgress,
} from "@/src/lib/analyzerRunner";

function throttle<T>(fn: (arg: T) => void, ms: number) {
  let last = 0;
  let pending: T | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (arg: T) => {
    pending = arg;
    const run = () => {
      if (pending !== null) {
        fn(pending);
        pending = null;
      }
      last = Date.now();
      timer = null;
    };
    const now = Date.now();
    if (now - last >= ms) {
      run();
    } else if (!timer) {
      timer = setTimeout(run, ms - (now - last));
    }
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.estimateProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.status === "RUNNING") {
    return NextResponse.json(
      { error: "Analysis already running" },
      { status: 409 }
    );
  }

  let body: { aiEnabled?: boolean; probeEnabled?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }
  const aiEnabled = body.aiEnabled === true;
  const probeEnabled = body.probeEnabled === true;

  let lastProgress: RunProgress = { logs: [], aiEnabled, probeEnabled };

  const updateProgress = throttle(async (progress: RunProgress) => {
    await prisma.estimateProject.update({
      where: { id },
      data: { progressJson: JSON.stringify(progress) },
    });
  }, 1500);

  runAnalyzer({
    projectId: id,
    url: project.url,
    aiEnabled,
    probeEnabled,
    onLog: () => {},
    onProgress: (p) => {
      lastProgress = { ...lastProgress, ...p };
      updateProgress(lastProgress);
    },
  }).then(async ({ exitCode }) => {
    const { jsonPath, htmlPath } = findAnalysisArtifacts(id);
    await prisma.estimateProject.update({
      where: { id },
      data: {
        status: exitCode === 0 ? "DONE" : "FAILED",
        analysisJsonPath: jsonPath,
        analysisHtmlPath: htmlPath,
        progressJson: JSON.stringify(lastProgress),
      },
    });
  });

  await prisma.estimateProject.update({
    where: { id },
    data: {
      status: "RUNNING",
      progressJson: JSON.stringify({ logs: [], phase: "starting", aiEnabled, probeEnabled }),
    },
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
