import { Badge } from "@/components/ui/Badge";

export function Toast({ message = "Cambios guardados correctamente" }: { message?: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg"><Badge variant="success">Demo</Badge><span className="ml-2">{message}</span></div>;
}
