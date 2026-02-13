"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";

export function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      setBookmarks(data ?? []);
      setLoading(false);
    };

    fetchBookmarks();
  }, []);

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
          className="rounded-lg border border-border p-4 transition-colors hover:bg-card"
        >
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {bookmark.title}
          </a>
          <p className="mt-1 truncate text-sm text-muted">{bookmark.url}</p>
        </li>
      ))}
    </ul>
  );
}
