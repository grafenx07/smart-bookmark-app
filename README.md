# Smart Bookmark

A clean, real-time bookmark manager built with Next.js and Supabase. Save links, organize them, and see updates instantly across tabs — no page refresh needed.

## Tech Stack

- **Next.js 16** — App Router, Server Components, Middleware
- **Supabase** — Auth (Google OAuth), Postgres database, Realtime subscriptions
- **Tailwind CSS** — Utility-first styling, no component libraries
- **TypeScript** — End-to-end type safety

## Features

- **Google OAuth login** — One-click sign in via Supabase Auth
- **Add bookmarks** — Save any URL with a title
- **Delete bookmarks** — Remove with optimistic UI updates
- **Realtime sync** — Changes in one tab appear instantly in another
- **Protected routes** — Middleware + layout-level auth guards
- **Mobile-first UI** — Responsive, accessible, and clean

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

### 2. Set up Supabase

Create a Supabase project and run this SQL to set up the `bookmarks` table:

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  title text not null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table bookmarks enable row level security;

-- Users can only see their own bookmarks
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

-- Users can only insert their own bookmarks
create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own bookmarks
create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);
```

Enable **Realtime** for the `bookmarks` table in Supabase Dashboard → Database → Replication.

### 3. Configure Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Add your Google Client ID and Secret (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
4. Set the authorized redirect URI to: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`

### 4. Environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Problems Faced & Solutions

### Auth redirects with App Router
Supabase OAuth returns an auth code to a callback URL. We handle this in a Route Handler (`/auth/callback/route.ts`) that exchanges the code for a session and redirects to `/dashboard`. Getting the redirect flow right with the App Router required careful cookie handling in both middleware and the server client.

### Row Level Security (RLS)
Without RLS policies, any authenticated user could read or delete anyone's bookmarks. We defined strict `select`, `insert`, and `delete` policies scoped to `auth.uid() = user_id`. The `user_id` column defaults to `auth.uid()` so the client doesn't need to send it explicitly.

### Realtime subscriptions
Supabase Realtime listens to Postgres changes via websockets. The key challenge is proper cleanup — if you don't remove the channel on component unmount, you get duplicate events and memory leaks. We use `supabase.removeChannel(channel)` in the effect cleanup function.

### Server vs Browser Supabase clients
Server Components can't access browser cookies directly, so we create separate clients. The server client manually reads/writes cookies via `next/headers`. The browser client uses `@supabase/ssr` which handles cookies automatically. Both share the same env vars but behave differently at runtime.

## Deployment

The app is Vercel-ready. Set the environment variables in Vercel's project settings and deploy:

```bash
vercel
```

## Live URL

> _Coming soon_

## Repository

> [GitHub](https://github.com/your-username/smart-bookmark-app)

## License

MIT
