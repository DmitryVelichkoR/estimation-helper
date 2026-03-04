import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { OverrideTargetType } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.estimateProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const overrides = await prisma.manualOverride.findMany({
    where: { projectId: id },
    orderBy: [{ targetType: "asc" }, { targetId: "asc" }],
  });

  return NextResponse.json(
    overrides.map((o) => ({
      id: o.id,
      targetType: o.targetType,
      targetId: o.targetId,
      devHours: o.devHours,
      qaHours: o.qaHours,
      notes: o.notes,
      updatedAt: o.updatedAt,
    }))
  );
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

  let body: { targetType: string; targetId: string; devHours?: number; qaHours?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetType: OverrideTargetType = body.targetType === "COMPONENT" ? "COMPONENT" : "FAMILY";
  const targetId = String(body.targetId ?? "").trim();
  if (!targetId) {
    return NextResponse.json({ error: "targetId required" }, { status: 400 });
  }

  const devHours = body.devHours != null ? Number(body.devHours) : null;
  const qaHours = body.qaHours != null ? Number(body.qaHours) : null;
  const notes = body.notes != null ? String(body.notes) : null;

  const existing = await prisma.manualOverride.findFirst({
    where: { projectId: id, targetType, targetId },
  });

  const data = {
    projectId: id,
    targetType,
    targetId,
    devHours: Number.isNaN(devHours) ? null : devHours,
    qaHours: Number.isNaN(qaHours) ? null : qaHours,
    notes: notes?.trim() || null,
  };

  const override = existing
    ? await prisma.manualOverride.update({
        where: { id: existing.id },
        data: { devHours: data.devHours, qaHours: data.qaHours, notes: data.notes },
      })
    : await prisma.manualOverride.create({ data });

  return NextResponse.json({
    id: override.id,
    targetType: override.targetType,
    targetId: override.targetId,
    devHours: override.devHours,
    qaHours: override.qaHours,
    notes: override.notes,
    updatedAt: override.updatedAt,
  });
}
