import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — used in Client Components.
 *
 * This client runs in the browser, so it can use cookies automatically
 * for session management. It should be used inside "use client" components
 * for actions like login, logout, and realtime subscriptions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
