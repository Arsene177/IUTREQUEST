"use client";

import { RequireAuth } from "@/components/layout/RequireAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebarProvider } from "@/context/MobileSidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <MobileSidebarProvider>
        <div className="flex min-h-screen bg-[var(--color-canvas)]">
          <Sidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </MobileSidebarProvider>
    </RequireAuth>
  );
}
