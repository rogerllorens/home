"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AdminDrawer, AdminModal, AdminToasts } from "@/components/admin/AdminStateProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-screen bg-slate-50"><AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><main className="lg:pl-72"><AdminTopbar onMenu={() => setMobileOpen(true)} /><div className="p-4 sm:p-6 lg:p-8">{children}</div></main><AdminToasts /><AdminDrawer /><AdminModal /></div>;
}
