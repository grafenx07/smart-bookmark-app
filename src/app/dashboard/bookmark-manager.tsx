"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";

/**
 * Helper to safely extract hostname from a URL for favicon display.
 * Returns empty string if URL is invalid to prevent crashes.
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function BookmarkManager() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    setBookmarks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookmarks();

    /**
     * Supabase Realtime subscription.
     *
     * Listens for INSERT and DELETE events on the "bookmarks" table.
     * When another tab or device modifies bookmarks, this callback fires
     * and we update state locally — no page refresh needed.
     *
     * We filter by user_id client-side so User A never sees User B's data.
     * Duplicate detection prevents the same bookmark from appearing twice
     * (once from optimistic update, once from realtime).
     *
     * The channel is cleaned up on unmount to prevent memory leaks.
     */
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      const userId = user?.id;

      const channel = supabase
        .channel("bookmarks-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "bookmarks" },
          (payload) => {
            const newBookmark = payload.new as Bookmark;
            // Only add if it belongs to the current user
            if (newBookmark.user_id === userId) {
              setBookmarks((prev) => {
                // Avoid duplicates (optimistic update already added it)
                if (prev.some((b) => b.id === newBookmark.id)) return prev;
                return [newBookmark, ...prev];
              });
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "bookmarks" },
          (payload) => {
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== payload.old.id)
            );
          }
        )
        .subscribe();

      channelRef = channel;
    });

    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  }, [fetchBookmarks]);

  // ─── Add Bookmark ───────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim() || !title.trim()) {
      setError("Both URL and title are required.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to add bookmarks.");
      setSubmitting(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("bookmarks")
      .insert({ url: url.trim(), title: title.trim(), user_id: user.id })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Optimistic: add to list instantly — no waiting for realtime
    if (data) {
      setBookmarks((prev) => [data as Bookmark, ...prev]);
    }

    setUrl("");
    setTitle("");
  };

  // ─── Delete Bookmark ────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    // Optimistic: remove from UI immediately
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const supabase = createClient();
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      // Restore if delete failed
      fetchBookmarks();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Add bookmark form */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            aria-label="Bookmark title"
          />
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            aria-label="Bookmark URL"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Bookmark"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </form>

      {/* Bookmark list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-muted">No bookmarks yet</p>
          <p className="mt-1 text-xs text-muted/60">Add your first bookmark above to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-muted hover:shadow-md"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {getHostname(bookmark.url) && (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(getHostname(bookmark.url))}&sz=32`}
                    alt=""
                    width={20}
                    height={20}
                    className="shrink-0 rounded"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {bookmark.title}
                  </a>
                  <p className="mt-0.5 truncate text-xs text-muted">{bookmark.url}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(bookmark.id)}
                className="ml-4 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-all sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-danger focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Delete ${bookmark.title}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
