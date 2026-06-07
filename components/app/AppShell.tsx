"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AppModal, AppToasts } from "@/components/app/AppStateProvider";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { OnboardingModal } from "@/components/auth/OnboardingModal";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="lg:pl-72">
        <AppTopbar onMenu={() => setMobileOpen(true)} />
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <AppToasts />
      <AppModal />
      <OnboardingModal />
    </div>
  );
}
