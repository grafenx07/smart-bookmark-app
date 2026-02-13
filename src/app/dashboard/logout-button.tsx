"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      Sign out
    </button>
  );
}
