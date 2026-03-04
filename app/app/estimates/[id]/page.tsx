import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/db";
import { EstimateDetail } from "./EstimateDetail";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.estimateProject.findUnique({
    where: { id },
  });
  if (!project) notFound();

  return (
    <main>
      <header className="border-b border-studio-border bg-studio-surface">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-medium text-studio-accent">
            Estimation Studio
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/app/estimates"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              Estimates
            </Link>
            <Link
              href="/app/new"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              New
            </Link>
            <Link
              href="/app/estimate"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              Estimate
            </Link>
            <Link
              href="/app/site-surface"
              className="text-studio-muted hover:text-studio-accent transition-colors"
            >
              Site surface
            </Link>
          </nav>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        <Link
          href="/app/estimates"
          className="text-sm text-studio-muted hover:text-studio-accent inline-block"
        >
          ← Back to estimates
        </Link>
        <h2 className="text-2xl font-light text-studio-accent">
          {project.url}
        </h2>
        <p className="text-studio-muted">
          Tech: {project.techKey} · Created{" "}
          {new Date(project.createdAt).toLocaleString()}
        </p>
        <EstimateDetail id={project.id} initialStatus={project.status} />
      </div>
    </main>
  );
}
