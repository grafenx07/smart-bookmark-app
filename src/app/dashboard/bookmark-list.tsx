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

export function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

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
     * We listen for INSERT and DELETE events on the "bookmarks" table.
     * When another tab or device modifies bookmarks, this callback fires
     * and we update state locally — no page refresh needed.
     *
     * RLS ensures only the current user's changes come through,
     * but we also filter by user_id client-side as a safeguard.
     *
     * The channel is cleaned up when the component unmounts to prevent
     * memory leaks and stale listeners.
     */
    const supabase = createClient();

    // Get current user ID to filter realtime events
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
                // Avoid duplicates (e.g. if we inserted it ourselves)
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

      // Store channel reference for cleanup
      channelRef = channel;
    });

    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  }, [fetchBookmarks]);

  const handleDelete = async (id: string) => {
    // Optimistic update: remove from UI immediately
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const supabase = createClient();
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      // If the delete failed, re-fetch to restore the correct state
      fetchBookmarks();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <svg className="mx-auto h-10 w-10 text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-muted">No bookmarks yet</p>
        <p className="mt-1 text-xs text-muted/60">Add your first bookmark above to get started.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {bookmarks.map((bookmark) => (
        <li
          key={bookmark.id}
          className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-muted hover:shadow-md"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Favicon fetched from Google's public API — no extra deps */}
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
  );
}
