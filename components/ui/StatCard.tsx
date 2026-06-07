import { Card } from "@/components/ui/Card";

export function StatCard({ title, value, description, trend, icon }: { title: string; value: string; description: string; trend?: string; icon?: string }) {
  return (
    <Card className="group hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        {icon && <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-lg font-bold text-blue-700">{icon}</div>}
      </div>
      <p className="mt-4 text-sm text-slate-600">{description}</p>
      {trend && <p className="mt-3 text-xs font-semibold text-emerald-600">{trend}</p>}
    </Card>
  );
}
