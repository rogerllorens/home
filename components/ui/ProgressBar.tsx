import { cn } from "@/lib/utils";

type Status = "success" | "warning" | "danger" | "info";
const colors: Record<Status, string> = {
  success: "from-emerald-500 to-cyan-500",
  warning: "from-amber-500 to-orange-500",
  danger: "from-red-500 to-amber-500",
  info: "from-blue-600 to-violet-600",
};

export function ProgressBar({ value, status = "info", className }: { value: number; status?: Status; className?: string }) {
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-slate-100", className)}>
      <div className={cn("h-full rounded-full bg-gradient-to-r", colors[status])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
