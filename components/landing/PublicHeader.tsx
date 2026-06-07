import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { publicRoutes } from "@/lib/routes";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 font-black text-white shadow-lg shadow-blue-600/25">R</div>
          <div><p className="font-black text-slate-950">Rankelia.ai</p><p className="hidden text-xs text-slate-500 sm:block">CSV-first ecommerce SEO</p></div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
          {publicRoutes.map((route) => <a className="hover:text-slate-950" href={route.href} key={route.href}>{route.label}</a>)}
        </nav>
        <div className="flex items-center gap-3">
          <Badge className="hidden md:inline-flex" variant="ai">IA SEO</Badge>
          <Button className="hidden sm:inline-flex" href="/login" variant="ghost">Entrar</Button>
          <Button href="/app/upload">Analizar gratis</Button>
        </div>
      </div>
    </header>
  );
}
