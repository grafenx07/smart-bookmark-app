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

### 1. Auth redirects with App Router
**Problem:** Supabase OAuth returns an auth code to a callback URL, but the Next.js App Router doesn't have traditional API routes like the Pages Router. The auth session wasn't being set properly because cookies weren't being forwarded correctly between the middleware and server components.

**Solution:** Created a Route Handler at `/auth/callback/route.ts` that exchanges the code for a session using `supabase.auth.exchangeCodeForSession(code)`. Added middleware (`middleware.ts`) that refreshes the auth session on every request by reading/writing cookies manually. This ensures server components always have fresh auth state.

### 2. Row Level Security (RLS) — `user_id` not being sent
**Problem:** After enabling RLS on the `bookmarks` table, inserting a bookmark returned: `"new row violates row-level security policy for table bookmarks"`. The insert wasn't including `user_id`, so the RLS `with check (auth.uid() = user_id)` policy rejected it.

**Solution:** Explicitly fetch the current user's ID before inserting: `const { data: { user } } = await supabase.auth.getUser()` and include `user_id: user.id` in the insert payload. Even though `auth.uid()` is available in SQL, the client-side insert must match what the policy expects.

### 3. Realtime showing other users' bookmarks
**Problem:** Supabase Realtime broadcasts all `INSERT` events on the `bookmarks` table to all connected clients. Without filtering, User A would see User B's bookmarks appear in real-time — breaking the privacy requirement.

**Solution:** Added a client-side filter in the realtime callback that checks `newBookmark.user_id === currentUserId` before adding to state. Also added duplicate detection (`prev.some(b => b.id === newBookmark.id)`) to prevent the same bookmark from appearing twice when the user who inserted it receives both the local state update and the realtime event.

### 4. Server vs Browser Supabase clients
**Problem:** Using a single Supabase client for both server and client components caused auth state issues. Server Components can't access browser cookies directly, leading to "not authenticated" errors even when the user was logged in.

**Solution:** Created two separate client factories: `lib/supabase/client.ts` (browser — uses `createBrowserClient` which handles cookies automatically) and `lib/supabase/server.ts` (server — uses `createServerClient` with manual cookie read/write via `next/headers`). Each request gets a fresh server client to avoid cross-request session leaks.

### 5. Delete button not accessible on mobile
**Problem:** The delete button was hidden with `opacity-0` and only appeared on hover (`group-hover:opacity-100`). Touch devices can't hover, so mobile users couldn't delete bookmarks.

**Solution:** Changed to `sm:opacity-0 sm:group-hover:opacity-100` — the button is always visible on mobile screens and only uses the hover-reveal pattern on desktop. This maintains the clean desktop UI while keeping mobile fully functional.

### 6. Environment variables not loading in Edge Runtime
**Problem:** After setting up `.env.local` correctly, the middleware (which runs in Edge Runtime) threw: `"Your project's URL and Key are required to create a Supabase client!"`. The env vars weren't being picked up.

**Solution:** The `.env.local` file had been accidentally emptied. Recreated it with the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values and cleared the `.next` cache directory (`rm -rf .next`) to force a fresh build that picks up the env vars.

## Deployment

The app is Vercel-ready. Set the environment variables in Vercel's project settings and deploy:

```bash
vercel
```

**Required environment variables on Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Post-deployment:** Update the Site URL in Supabase Authentication settings to your Vercel domain, and add the Vercel domain to Google OAuth authorized JavaScript origins.

## Live URL

> _Coming soon_

## Repository

> [GitHub](https://github.com/your-username/smart-bookmark-app)

## License

MIT
