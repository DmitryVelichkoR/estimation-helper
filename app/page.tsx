import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center space-y-12">
        <h1 className="text-4xl font-light tracking-tight text-studio-accent">
          Estimation Studio
        </h1>
        <p className="text-lg text-studio-muted leading-relaxed">
          Analyze reference sites, detect components, and estimate implementation
          effort with clarity and confidence.
        </p>
        <Link
          href="/app/new"
          className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-studio-accent hover:bg-stone-600 rounded-lg transition-colors"
        >
          Start estimate
        </Link>
      </div>
    </main>
  );
}
