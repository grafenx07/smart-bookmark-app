import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Dashboard layout — acts as a server-side auth guard.
 * Every route under /dashboard is protected: unauthenticated users
 * are redirected to /login before any child content renders.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
