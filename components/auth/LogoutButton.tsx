"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ className = "rounded-2xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return <button className={className} disabled={loading} onClick={handleLogout}>{loading ? "Saliendo…" : "Salir"}</button>;
}
