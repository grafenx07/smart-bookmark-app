import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Smart Bookmark
        </h1>
        <p className="mt-4 text-muted">
          Save and organize your bookmarks with ease.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Get Started
        </Link>
      </main>
    </div>
  );
}
