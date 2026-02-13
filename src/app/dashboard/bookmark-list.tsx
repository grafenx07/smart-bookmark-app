"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";

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
     * The channel is cleaned up when the component unmounts to prevent
     * memory leaks and stale listeners.
     */
    const supabase = createClient();
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookmarks" },
        (payload) => {
          setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
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

    return () => {
      supabase.removeChannel(channel);
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
    return <p className="text-sm text-muted">Loading bookmarks...</p>;
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted">No bookmarks yet. Add one above!</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {bookmarks.map((bookmark) => (
        <li
          key={bookmark.id}
          className="flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:bg-card"
        >
          <div className="min-w-0 flex-1">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {bookmark.title}
            </a>
            <p className="mt-1 truncate text-sm text-muted">{bookmark.url}</p>
          </div>
          <button
            onClick={() => handleDelete(bookmark.id)}
            className="ml-4 shrink-0 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label={`Delete ${bookmark.title}`}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
