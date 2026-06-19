import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function EmptyState({ icon = "✦", title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl text-white shadow-lg shadow-blue-600/20">{icon}</div>
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}
