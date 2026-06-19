import { Card } from "@/components/ui/Card";

const faqs = [
  ["¿Publica automáticamente?", "No. La base inicial está pensada para revisar y exportar CSV antes de importar."],
  ["¿Garantiza rankings?", "No. Ayuda a crear una base SEO consistente, pero el ranking depende de muchos factores."],
  ["¿Sirve para categorías?", "Sí. El posicionamiento incluye productos y categorías desde la arquitectura inicial."],
];
export function FAQSection() {
  return <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"><h2 className="text-center text-3xl font-black text-slate-950">Preguntas frecuentes</h2><div className="mt-8 space-y-4">{faqs.map(([q, a]) => <Card key={q}><h3 className="font-bold text-slate-950">{q}</h3><p className="mt-2 text-slate-600">{a}</p></Card>)}</div></section>;
}
