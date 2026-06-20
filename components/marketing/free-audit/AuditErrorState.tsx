import { Card } from "@/components/ui/Card";

export function AuditErrorState({ message }: { message: string }) {
  return <Card className="border-red-200 bg-red-50"><p className="text-sm font-bold uppercase text-red-600">No se pudo completar la auditoría</p><p className="mt-2 text-slate-700">{message}</p><p className="mt-2 text-sm text-slate-500">Solo podemos auditar URLs públicas http/https y nunca IPs privadas, localhost ni recursos internos.</p></Card>;
}
