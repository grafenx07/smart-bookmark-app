"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AddBookmarkForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim() || !title.trim()) {
      setError("Both URL and title are required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("bookmarks")
      .insert({ url: url.trim(), title: title.trim() });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setUrl("");
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
          disabled={loading}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Bookmark"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </form>
  );
}
