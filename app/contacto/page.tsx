import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Contacto | Rankelia.ai", description: "Contacta con Rankelia.ai para beta ecommerce, agencias SEO y catálogos grandes." };
export default function ContactPage() { return <main className="mx-auto max-w-4xl px-4 py-20"><h1 className="text-5xl font-black">Hablemos de tu catálogo ecommerce</h1><p className="mt-5 text-lg text-slate-600">Para agencias, ecommerce managers y catálogos B2B. Cuéntanos volumen, plataforma y objetivo.</p><Card className="mt-8"><p className="text-lg font-semibold">Email: soporte@rankelia.ai</p><p className="mt-2 text-slate-600">También puedes empezar con la auditoría gratuita y crear cuenta cuando quieras guardar resultados.</p><div className="mt-6 flex gap-3"><Button href="/">Auditar tienda</Button><Button href="/login?mode=register" variant="secondary">Crear cuenta</Button></div></Card></main>; }
