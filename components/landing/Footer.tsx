import Link from "next/link";

export function Footer() {
  const legal = [["Privacidad", "/privacy"], ["Términos", "/terms"], ["Cookies", "/cookies"], ["Soporte", "/support"]];
  return <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><p>© 2026 Rankelia.ai · Ecommerce SEO Copilot CSV-first</p><p>Shopify · Prestashop · WooCommerce · CSV genérico</p></div><div className="flex flex-wrap gap-4"><span>Archivos privados · Descargas temporales · Revisión humana antes de publicar</span>{legal.map(([label, href]) => <Link className="font-semibold text-slate-700 hover:text-blue-600" href={href} key={href}>{label}</Link>)}</div></div></footer>;
}
