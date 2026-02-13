import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { AddBookmarkForm } from "./add-bookmark-form";
import { BookmarkList } from "./bookmark-list";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Smart Bookmark</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <AddBookmarkForm />
        <BookmarkList />
      </main>
    </div>
  );
}
