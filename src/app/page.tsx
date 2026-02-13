import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <main className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Smart Bookmark
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted">
          Save, organize, and access your bookmarks from anywhere.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
        >
          Get Started
        </Link>
      </main>
    </div>
  );
}
