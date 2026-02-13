import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client — used in Server Components, Route Handlers, and
 * Server Actions.
 *
 * Unlike the browser client, this one must manually read and write cookies
 * because server-side code does not have direct access to the browser cookie
 * jar. Each request gets its own fresh client to avoid cross-request leaks.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component where cookies
            // cannot be set. This is safe to ignore when the middleware
            // is handling session refresh.
          }
        },
      },
    }
  );
}
