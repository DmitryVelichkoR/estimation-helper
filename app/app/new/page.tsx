import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/db";
import { NewEstimateForm } from "./NewEstimateForm";

async function createProject(formData: FormData) {
  "use server";
  const url = formData.get("url")?.toString()?.trim();
  const techKey = formData.get("techKey")?.toString() ?? "custom";
  const techConfigJson = formData.get("techConfigJson")?.toString() ?? "{}";
  if (!url) return;
  const project = await prisma.estimateProject.create({
    data: {
      url,
      techKey,
      techConfigJson,
      status: "DRAFT",
      artifactsDir: "artifacts/",
    },
  });
  await prisma.estimateProject.update({
    where: { id: project.id },
    data: { artifactsDir: `artifacts/${project.id}` },
  });
  redirect(`/app/estimates/${project.id}`);
}

export default function NewEstimatePage() {
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
          </nav>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        <h2 className="text-2xl font-light text-studio-accent">
          New estimate
        </h2>
        <p className="text-studio-muted">
          Create a new site estimate. Choose a tech profile and adjust complexity.
        </p>
        <NewEstimateForm createProject={createProject} />
      </div>
    </main>
  );
}
