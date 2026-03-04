import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getArtifactsDir } from "@/src/lib/analyzerRunner";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pathParam = req.nextUrl.searchParams.get("path");
  if (!pathParam || pathParam.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const base = getArtifactsDir(id);
  const fullPath = path.join(base, pathParam);
  if (!fullPath.startsWith(base)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(fullPath).toLowerCase();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".html": "text/html",
    ".json": "application/json",
  };
  const contentType = types[ext] ?? "application/octet-stream";

  const buf = fs.readFileSync(fullPath);
  return new NextResponse(buf, {
    headers: { "Content-Type": contentType },
  });
}
