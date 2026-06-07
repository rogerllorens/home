import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function PermissionDenied() {
  return (
    <main className="radial-premium flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="max-w-xl text-center" variant="elevated">
        <Badge variant="danger">Acceso restringido</Badge>
        <h1 className="mt-5 text-4xl font-black text-slate-950">Esta zona es solo para administradores de Rankelia</h1>
        <p className="mt-3 text-slate-600">Tu sesión es válida, pero tu perfil no tiene rol interno. Si necesitas acceso al backoffice, pide a un admin que actualice tu rol desde Supabase.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/app">Volver a mi dashboard</Button>
          <Link className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50" href="/">Ver landing</Link>
        </div>
      </Card>
    </main>
  );
}
