import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginButton } from "./login-button";

export default async function LoginPage() {
  // If user is already logged in, redirect to dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Smart Bookmark</h1>
          <p className="mt-2 text-sm text-muted">Sign in to manage your bookmarks</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
