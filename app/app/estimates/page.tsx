import Link from "next/link";
import { prisma } from "@/src/lib/db";

export default async function EstimatesPage() {
  const projects = await prisma.estimateProject.findMany({
    orderBy: { createdAt: "desc" },
  });

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
        <h2 className="text-2xl font-light text-studio-accent">
          Estimates
        </h2>
        <p className="text-studio-muted">
          Your estimates will appear here.
        </p>
        {projects.length === 0 ? (
          <div className="rounded-lg border border-studio-border bg-studio-surface p-12 text-center text-studio-muted">
            No estimates yet.{" "}
            <Link href="/app/new" className="text-studio-accent hover:underline">
              Create your first estimate
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/app/estimates/${p.id}`}
                  className="block rounded-lg border border-studio-border bg-studio-surface px-6 py-4 hover:border-studio-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-studio-accent truncate">
                      {p.url}
                    </span>
                    <span className="text-sm text-studio-muted shrink-0 ml-4">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-sm text-studio-muted mt-1">
                    {p.techKey} · {new Date(p.createdAt).toLocaleString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
