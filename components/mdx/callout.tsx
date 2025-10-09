import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Callout({ children, type = "info" }: { children: ReactNode; type?: "info" | "success" | "warning" }) {
  const colors: Record<string, string> = {
    info: "bg-[#1f2937]/70 border-[#60A5FA]/40",
    success: "bg-[#1c3824]/70 border-[#22C55E]/40",
    warning: "bg-[#33230a]/70 border-[#F59E0B]/40"
  };
  return (
    <div className={cn("mt-6 rounded-2xl border p-4 text-sm", colors[type])}>
      {children}
    </div>
  );
}
