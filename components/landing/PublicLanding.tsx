"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { FreeAuditSection } from "@/components/marketing/free-audit/FreeAuditSection";
import {
  analyzePublicCSV,
  downloadCsv,
  formatCurrency,
  formatNumber,
  getRecommendedPack,
  parseCSV,
  platformExamples,
  publicDemoCsv,
  publicTemplateCsv,
  type PublicDiagnosis,
} from "@/lib/public-csv";
import { EXTRA_PRODUCT_PACKS, SUBSCRIPTION_PLANS, PRODUCT_STANDARD_CREDITS, formatPricePerProduct } from "@/lib/pricing";

type ModalState = { type: "platform"; platform: keyof typeof platformExamples } | null;

type ToastState = { message: string; type: "info" | "success" | "warning" } | null;

const navItems = [
  ["Inicio", "hero"],
  ["Auditoría SEO", "free-audit"],
  ["Cómo funciona", "como-funciona"],
  ["Ejemplos", "antes-despues"],
  ["Ahorro", "ahorro"],
  ["Productos extra", "creditos"],
  ["Precios", "precios"],
  ["FAQ", "faq"],
];

const heroBadges = ["CSV", "Shopify", "Prestashop", "WooCommerce", "SEO Score", "Preview gratis", "Sin copiar producto por producto"];

const creditPacks = EXTRA_PRODUCT_PACKS.map((pack) => ({ products: pack.quantity, credits: pack.quantity * PRODUCT_STANDARD_CREDITS, price: pack.price, ideal: `${pack.quantity.toLocaleString("es-ES")} productos SEO extra para lotes CSV` }));

const monthlyPlans = SUBSCRIPTION_PLANS.map((plan) => ({ id: plan.id, name: plan.name, price: plan.price, products: `${plan.monthlyProducts.toLocaleString("es-ES")} productos estándar/mes`, equivalent: plan.equivalent, features: plan.features, cta: plan.id === "free" ? "Empezar gratis" : `Elegir ${plan.name}`, featured: plan.featured }));

const featureGroups = [
  { title: "Producto SEO", badge: "Fichas", icon: "▦", items: ["Descripción corta", "Descripción larga", "Bullets", "Beneficios", "Características", "Casos de uso"] },
  { title: "Metadatos", badge: "SERP", icon: "◎", items: ["Meta title", "Meta description", "Slug", "Alt text"] },
  { title: "Keywords y entidades", badge: "SEO", icon: "✦", items: ["Keyword principal", "Secundarias", "Long-tail", "Entidades"] },
  { title: "Categorías SEO", badge: "Collections", icon: "◫", items: ["Texto superior", "Texto inferior", "H1", "FAQs", "CollectionPage"] },
  { title: "Calidad", badge: "Score", icon: "◆", items: ["Score SEO", "Score conversión", "Avisos", "Anti-repetición"] },
  { title: "Exportación", badge: "CSV", icon: "↓", items: ["Shopify", "Prestashop", "WooCommerce", "CSV genérico"] },
];

const allFeatures = [
  "Descripciones cortas", "Descripciones largas", "Meta titles", "Meta descriptions", "Slugs limpios", "Bullets comerciales", "Beneficios", "Características técnicas", "Casos de uso", "FAQs de producto", "Schema Product JSON-LD", "Textos superiores de categoría", "Textos inferiores de categoría", "H1 de categoría", "FAQs de categoría", "Schema CollectionPage", "Alt text", "Keyword principal", "Keywords secundarias", "Keywords long-tail", "Entidades SEO", "Intención de búsqueda", "CTA recomendado", "Enlaces internos", "Score SEO", "Score conversión", "Avisos de calidad", "Anti-repetición", "Duplicados", "Informe de lote"
];

const platformCards = [
  { name: "Shopify", fields: "Handle, Title, Body HTML, Vendor, Tags, SEO Title, SEO Description, Image Alt Text", text: "Para tiendas DTC y catálogos importables con handles, tags y campos SEO." },
  { name: "Prestashop", fields: "Name, Short description, Description, Meta title, Meta description, URL rewritten, Categories", text: "Enfoque fuerte en ecommerce europeo, catálogos de proveedor y URL reescritas." },
  { name: "WooCommerce", fields: "Name, SKU, Short description, Description, Categories, Tags, Yoast title, Yoast description", text: "CSV listo para productos, categorías y metadatos compatibles con flujos WordPress." },
  { name: "CSV genérico", fields: "sku, title, short_description, long_description, meta_title, meta_description, slug", text: "Para ERPs, PIMs, marketplaces, migraciones o importaciones personalizadas." },
] as const;

const useCases = [
  ["Tiendas Shopify con muchos productos", "Fichas importadas sin estructura SEO.", "Metas, descripciones, tags y alt text.", "CSV listo para revisar e importar."],
  ["Prestashop con catálogo de proveedor", "Textos repetidos o pobres del fabricante.", "Descripciones, slugs y avisos de calidad.", "Base SEO adaptada a Prestashop."],
  ["WooCommerce sin metadatos", "Productos publicados con Yoast vacío.", "Titles, descriptions, slugs y keywords.", "Optimización escalable por CSV."],
  ["Agencias SEO ecommerce", "Demasiadas fichas para redactar una a una.", "Workflow por lotes y preview de muestra.", "Entrega más rápida y consistente."],
  ["Catálogos B2B industriales", "Datos técnicos difíciles de convertir.", "Beneficios, casos de uso y entidades.", "Fichas más claras para compra B2B."],
  ["Migraciones ecommerce", "Hay que rehacer URLs, metas y categorías.", "Slugs limpios y columnas de exportación.", "Menos trabajo manual previo a migrar."],
  ["Categorías transaccionales vacías", "Listados sin texto superior ni FAQs.", "H1, textos, FAQs y CollectionPage.", "Categorías con mejor base semántica."],
  ["Marketplaces y ERPs", "Necesidad de formato neutro para importar.", "CSV genérico con columnas SEO.", "Salida compatible con flujos internos."],
];

const representativeCases = [
  ["CS", "Consultora SEO ecommerce", "Lo potente no es solo generar texto: es recibir un CSV ordenado con metadatos, keywords, descripciones y avisos de calidad.", "CSV + metadatos"],
  ["EM", "Ecommerce Manager", "Para catálogos importados del proveedor, Rankelia ayuda a convertir textos pobres en una base SEO revisable.", "Catálogo proveedor"],
  ["AS", "Agencia SEO", "El enfoque por lotes y la exportación para Prestashop/WooCommerce reduce muchísimo trabajo manual.", "Agencia"],
  ["B2", "Catálogo B2B", "Las fichas técnicas ganan estructura: beneficios, características, casos de uso, metas y avisos.", "Industrial"],
];

const faqItems = [
  ["¿Qué es Rankelia.ai?", "Un SaaS de IA para ecommerce SEO que transforma CSV de productos y categorías en contenido SEO estructurado y exportable."],
  ["¿Para qué sirve un generador CSV SEO?", "Sirve para optimizar muchos productos o categorías de golpe sin copiar y pegar ficha por ficha."],
  ["¿Funciona con Excel/XLSX?", "En beta procesamos CSV real. XLSX queda documentado para v1.1 para no prometer una importación que aún no es productiva."],
  ["¿Funciona con CSV?", "Sí. Esta landing ya parsea CSV localmente para mostrar un diagnóstico demo sin backend."],
  ["¿Funciona con Shopify?", "Sí. Rankelia está preparada para exportar columnas como Handle, Body HTML, SEO Title y SEO Description."],
  ["¿Funciona con Prestashop?", "Sí. Prestashop es prioritario para Rankelia, con meta title, meta description, URL rewritten y descripciones."],
  ["¿Funciona con WooCommerce?", "Sí. Puede preparar CSV con SKU, descripciones, categorías, tags y campos SEO tipo Yoast."],
  ["¿Genera keywords principales y secundarias?", "Sí. La propuesta incluye keyword principal, secundarias, long-tail y entidades relacionadas."],
  ["¿Genera keywords long-tail?", "Sí. Las long-tail ayudan a enriquecer fichas y categorías con búsquedas más específicas."],
  ["¿Genera categorías SEO?", "Sí. Rankelia no se limita a productos: genera H1, textos superiores/inferiores, FAQs y Schema CollectionPage sugerido."],
  ["¿Genera Schema Product?", "Sí. La salida puede incluir Schema Product JSON-LD sugerido para revisión."],
  ["¿Genera alt text para imágenes?", "Sí. Puede preparar alt text orientado a producto, keyword y atributos relevantes."],
  ["¿Sustituye a un redactor SEO?", "No necesariamente. Reduce trabajo operativo y genera una base avanzada que conviene revisar."],
  ["¿Garantiza posicionamiento?", "No. Rankelia mejora la base de contenido, pero ningún software serio debe prometer rankings garantizados."],
  ["¿Cómo funcionan los productos incluidos?", "De cara al usuario trabajas con productos SEO estándar, Pro o Premium. Rankelia usa créditos internos para reservas y consumo seguro, pero no los vende como pricing principal."],
  ["¿Qué pasa si subo un CSV grande?", "En producción se procesará como job en segundo plano con estado y descarga al terminar."],
  ["¿Puedo cerrar la página mientras procesa?", "La versión real estará preparada para cerrar la página y recibir un email cuando el lote esté listo."],
  ["¿Puedo revisar antes de procesar todo?", "Sí. El flujo está pensado para diagnóstico gratuito y preview antes de consumir productos del plan."],
  ["¿Evita contenido repetitivo?", "Rankelia incorpora avisos anti-repetición y alertas de posible contenido duplicado."],
  ["¿Puedo descargar resultados?", "Sí. El objetivo es descargar CSV final para Shopify, Prestashop, WooCommerce o CSV genérico."],
  ["¿Se podrá conectar con APIs en el futuro?", "Sí. La arquitectura deja preparada la evolución a conectores, aunque esta fase es CSV-first."],
  ["¿Los datos deben revisarse antes de publicar?", "Sí. Rankelia genera una base SEO avanzada, pero el contenido debe revisarse antes de publicar."],
  ["¿Funciona para catálogos B2B?", "Sí. Es especialmente útil cuando hay características técnicas, usos, materiales y beneficios que estructurar."],
  ["¿Sirve para agencias SEO?", "Sí. Permite trabajar por lotes, mantener consistencia y entregar CSV revisables a clientes."],
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}


export function PublicLanding() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diagnosis, setDiagnosis] = useState<PublicDiagnosis | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [products, setProducts] = useState(1000);
  const [creditIndex, setCreditIndex] = useState(4);

  const savings = useMemo(() => {
    const manualHours = Math.round((products * 8) / 60);
    const rankeliaHours = Math.max(1, Math.round((products * 0.5) / 60));
    const savedHours = Math.max(0, manualHours - rankeliaHours);
    const manualCost = manualHours * 25;
    const credits = products * PRODUCT_STANDARD_CREDITS;
    const recommendedPack = getRecommendedPack(credits);
    const rankeliaCost = recommendedPack.price;
    const saving = Math.max(0, manualCost - rankeliaCost);
    const percentage = manualCost ? Math.round((saving / manualCost) * 100) : 0;
    return { manualHours, rankeliaHours, savedHours, manualCost, credits, recommendedPack, rankeliaCost, saving, percentage };
  }, [products]);

  const selectedPack = creditPacks[creditIndex];

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Rankelia.ai",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Convierte catálogos CSV en contenido SEO ecommerce revisable y exportable.",
    offers: monthlyPlans.map((plan) => ({ "@type": "Offer", name: plan.name, price: plan.price.replace(" €/mes", "").replace(" €", ""), priceCurrency: "EUR" })),
  };
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.slice(0, 8).map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };

  const showToast = (message: string, type: NonNullable<ToastState>["type"] = "info") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3600);
  };

  const renderDiagnosis = (rows: ReturnType<typeof parseCSV>) => {
    const nextDiagnosis = analyzePublicCSV(rows);
    setDiagnosis(nextDiagnosis);
    showToast("Diagnóstico gratuito generado con datos locales.", "success");
    window.setTimeout(() => scrollToSection("diagnostico"), 80);
  };

  const loadDemoCSV = () => renderDiagnosis(parseCSV(publicDemoCsv));

  const handleAnalyzeClick = () => {
    if (!diagnosis) {
      showToast("Sube un CSV o usa el ejemplo para ver el diagnóstico.", "warning");
      fileInputRef.current?.focus();
      return;
    }
    scrollToSection("diagnostico");
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      showToast("XLSX detectado. En beta procesamos CSV real; convierte tu hoja a CSV antes de subirla.", "warning");
      return;
    }

    if (!lowerName.endsWith(".csv")) {
      showToast("Formato no reconocido. Sube un CSV.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => renderDiagnosis(parseCSV(String(reader.result ?? "")));
    reader.onerror = () => showToast("No hemos podido leer el archivo local.", "warning");
    reader.readAsText(file);
  };

  const openPlatformModal = (platform: keyof typeof platformExamples) => setModal({ type: "platform", platform });

  const downloadTemplateCSV = () => {
    downloadCsv("rankelia_plantilla_productos_seo.csv", publicTemplateCsv);
    showToast("Plantilla CSV descargada.", "success");
  };

  const downloadPlatformExample = (platform: keyof typeof platformExamples) => {
    downloadCsv(`rankelia_${platform.toLowerCase().replace(/\s+/g, "_")}_example.csv`, platformExamples[platform]);
    showToast(`Ejemplo ${platform} descargado.`, "success");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button aria-label="Ir al inicio" className="flex items-center gap-3" onClick={() => scrollToSection("hero")}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 font-black text-white shadow-lg shadow-blue-600/25">R</span>
            <span className="text-left"><span className="block font-black">Rankelia.ai</span><span className="hidden text-xs text-slate-500 sm:block">Ecommerce SEO Copilot CSV-first</span></span>
          </button>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex" aria-label="Navegación principal">
            {navItems.map(([label, id]) => <button className="transition hover:text-slate-950" key={id} onClick={() => scrollToSection(id)}>{label}</button>)}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Button href="/login" variant="ghost">Login</Button>
            <Button href="/login?mode=register" variant="secondary">Registrarse</Button>
            <Button onClick={() => scrollToSection("hero-uploader")}>Analizar CSV gratis</Button>
          </div>
          <button aria-expanded={mobileOpen} aria-label="Abrir menú" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-bold lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
        </div>
        {mobileOpen && <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden"><div className="grid gap-2">{navItems.map(([label, id]) => <button className="rounded-2xl px-4 py-3 text-left font-semibold hover:bg-slate-100" key={id} onClick={() => { setMobileOpen(false); scrollToSection(id); }}>{label}</button>)}<Button href="/login?mode=register">Registrarse</Button></div></div>}
      </header>

      <main>
        <section id="hero" className="radial-premium premium-grid overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.03fr_0.97fr] lg:px-8 lg:py-20">
            <div>
              <Badge variant="ai">Ecommerce SEO Copilot CSV-first</Badge>
              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">Optimiza productos y categorías SEO desde un CSV</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Sube tu catálogo y Rankelia genera descripciones, metatítulos, metadescripciones, keywords, FAQs, slugs y textos SEO listos para Shopify, Prestashop y WooCommerce.</p>
              <div className="mt-7 flex flex-wrap gap-2">{heroBadges.map((badge) => <Badge key={badge}>{badge}</Badge>)}</div>
              <div id="hero-uploader" className="mt-8 rounded-[2rem] border border-blue-200 bg-white/85 p-4 shadow-2xl shadow-blue-200/40 backdrop-blur">
                <input ref={fileInputRef} aria-label="Subir archivo CSV" accept=".csv,text/csv" className="sr-only" id="catalog-file" onChange={handleFileUpload} type="file" />
                <label className="block cursor-pointer rounded-[1.5rem] border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50 p-8 text-center transition hover:-translate-y-0.5 hover:border-blue-400" htmlFor="catalog-file">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl text-white shadow-xl shadow-blue-600/25">↑</span>
                  <span className="mt-5 block text-xl font-black">Arrastra tu CSV aquí</span>
                  <span className="mt-2 block text-sm text-slate-600">o haz clic para seleccionar archivo · .csv</span>
                  <span className="mt-1 block text-sm font-semibold text-blue-700">Analizamos gratis las primeras filas antes de crear cuenta</span>
                </label>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button className="flex-1" onClick={handleAnalyzeClick}>Analizar mi catálogo gratis</Button><Button className="flex-1" onClick={loadDemoCSV} variant="secondary">Usar CSV de ejemplo</Button><Button className="flex-1" onClick={downloadTemplateCSV} variant="secondary">Descargar plantilla CSV</Button></div>
                <p className="mt-4 text-center text-sm font-semibold text-slate-500">Sin tarjeta · Diagnóstico instantáneo · Preview de 5 filas al crear cuenta</p>
              </div>
            </div>

            <Card className="relative overflow-hidden" variant="elevated">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-300/30 blur-3xl" />
              <div className="relative flex items-center justify-between gap-4"><div><Badge variant="success">Listo para optimizar</Badge><h2 className="mt-3 text-2xl font-black">productos-prestashop.csv</h2><p className="text-sm text-slate-500">Diagnóstico visual del lote</p></div><div className="rounded-3xl bg-slate-950 p-4 text-white"><p className="text-xs text-slate-300">Score actual</p><p className="text-3xl font-black">42</p></div></div>
              <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{[["Productos", "1.240"], ["Categorías", "32"], ["Metas vacías", "322"], ["Desc. cortas", "418"], ["Duplicados", "46"], ["Score estimado", "86/100"]].map(([label, value]) => <div className="rounded-2xl border border-slate-200 bg-white p-4" key={label}><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}</div>
              <div className="relative mt-6"><div className="mb-2 flex justify-between text-sm font-bold"><span>Potencial de mejora</span><span>86%</span></div><ProgressBar value={86} status="success" /></div>
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Producto</th><th className="p-3">Problema</th><th className="p-3">Prioridad</th></tr></thead><tbody>{["Bota seguridad S3", "Taladro percutor 18V", "Filtro de aire"].map((name, index) => <tr className="border-t border-slate-100" key={name}><td className="p-3 font-bold">{name}</td><td className="p-3">{["Descripción corta", "Descripción vacía", "Meta pendiente"][index]}</td><td className="p-3"><Badge variant={index === 0 ? "warning" : "danger"}>{index === 2 ? "Media" : "Alta"}</Badge></td></tr>)}</tbody></table></div>
              <Button className="relative mt-6 w-full" onClick={loadDemoCSV}>Generar preview</Button>
            </Card>
          </div>
        </section>

        <FreeAuditSection />

        <section id="diagnostico" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {!diagnosis ? <Card className="text-center" variant="gradient"><Badge variant="info">Esperando CSV</Badge><h2 className="mt-4 text-4xl font-black">Diagnóstico gratuito del catálogo</h2><p className="mx-auto mt-3 max-w-2xl text-slate-600">Usa el CSV de ejemplo o sube tu propio archivo para ver productos, categorías, campos vacíos, créditos estimados y oportunidades SEO antes de registrarte.</p><Button className="mt-6" onClick={loadDemoCSV}>Probar diagnóstico con CSV demo</Button></Card> : <div className="animate-[fadeIn_0.4s_ease-out]"><div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><Badge variant="success">Diagnóstico gratuito antes de crear cuenta</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Tu catálogo tiene oportunidades SEO</h2><p className="mt-3 max-w-2xl text-slate-600">Rankelia detecta problemas operativos y estima el impacto antes de pedir registro o consumir créditos.</p></div><div className="flex gap-3"><ScoreBadge score={diagnosis.currentScore} /><ScoreBadge score={diagnosis.estimatedScore} /></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Productos detectados", diagnosis.products], ["Categorías detectadas", diagnosis.categories], ["Descripciones vacías", diagnosis.emptyDescriptions], ["Descripciones cortas", diagnosis.shortDescriptions], ["Meta descriptions pendientes", diagnosis.pendingMetaDescriptions], ["Posibles duplicados", diagnosis.possibleDuplicates], ["Datos insuficientes", diagnosis.insufficientData], ["Keywords detectadas", diagnosis.detectedKeywords], ["Créditos estimados", diagnosis.estimatedCredits], ["Horas ahorradas", diagnosis.savedHours], ["Score actual", diagnosis.currentScore], ["Score tras Rankelia", diagnosis.estimatedScore]].map(([label, value]) => <Card key={label.toString()}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{typeof value === "number" ? formatNumber(value) : value}</p></Card>)}</div><div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Producto", "Categoría", "Descripción actual", "Keyword", "Problema detectado", "Prioridad"].map((header) => <th className="px-5 py-4" key={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{diagnosis.preview.map((row) => <tr key={`${row.product}-${row.issue}`}><td className="px-5 py-4 font-bold">{row.product}</td><td className="px-5 py-4">{row.category}</td><td className="max-w-xs px-5 py-4 text-slate-600">{row.description}</td><td className="px-5 py-4">{row.keyword}</td><td className="px-5 py-4">{row.issue}</td><td className="px-5 py-4"><Badge variant={row.priority === "Alta" ? "danger" : row.priority === "Media" ? "warning" : "success"}>{row.priority}</Badge></td></tr>)}</tbody></table></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button href="/login?mode=register">Crear cuenta gratis y generar 5 filas de muestra</Button><Button onClick={() => scrollToSection("antes-despues")} variant="secondary">Ver ejemplo antes/después</Button></div></div>}
        </section>

        <section id="antes-despues" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl"><Badge variant="ai">Antes / Después</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Antes: fichas pobres. Después: contenido SEO listo para importar.</h2><p className="mt-4 text-lg text-slate-600">Rankelia no genera texto suelto: estructura cada fila para SEO, conversión y exportación.</p></div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2"><Card className="border-red-200 bg-red-50/60"><div className="flex items-center justify-between"><h3 className="text-2xl font-black">Antes</h3><ScoreBadge score={42} /></div>{[["Producto", "Bota seguridad S3 negra"], ["Descripción", "Bota cómoda para trabajar. Buena calidad."], ["Meta title", "Bota seguridad"], ["Meta description", "Vacía"], ["Keyword", "No definida"], ["FAQs", "No incluidas"], ["Schema", "No incluido"], ["Alt text", "No incluido"]].map(([label, value]) => <div className="mt-4 rounded-2xl bg-white p-4" key={label}><p className="text-xs font-bold uppercase text-red-500">{label}</p><p className="mt-1 text-slate-700">{value}</p></div>)}</Card><Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50"><div className="flex items-center justify-between"><h3 className="text-2xl font-black">Después</h3><ScoreBadge score={87} /></div>{[["Nombre SEO", "Bota de seguridad S3 negra con puntera reforzada"], ["Keyword principal", "bota seguridad s3"], ["Keywords secundarias", "bota trabajo, calzado laboral, bota con puntera reforzada, calzado seguridad antideslizante"], ["Long-tail", "bota de seguridad s3 para taller, bota laboral antideslizante con puntera"], ["Entidades", "puntera reforzada, suela antideslizante, protección S3, uso intensivo"], ["Descripción corta", "Bota de seguridad S3 diseñada para trabajos exigentes, con puntera reforzada y suela antideslizante."], ["Meta title", "Bota de seguridad S3 negra | Trabajo e industria"], ["Avisos", "Revisar certificación exacta antes de publicar."]].map(([label, value]) => <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4" key={label}><p className="text-xs font-bold uppercase text-emerald-600">{label}</p><p className="mt-1 text-slate-700">{value}</p></div>)}<Button className="mt-5" onClick={() => scrollToSection("hero-uploader")}>Analizar mi catálogo gratis</Button></Card></div>
        </section>

        <section id="como-funciona" className="dark-radial text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><Badge variant="ai">Workflow completo</Badge><h2 className="mt-4 max-w-3xl text-4xl font-black lg:text-5xl">De CSV desordenado a catálogo SEO listo para importar</h2><div className="mt-10 grid gap-4 md:grid-cols-5">{[["1", "Sube CSV", "Arrastra tu archivo o usa una plantilla de ejemplo."], ["2", "Detecta problemas", "Identifica columnas, categorías, keywords y campos mejorables."], ["3", "Preview gratuita", "Ves una muestra para validar estilo y calidad."], ["4", "Procesa el lote", "Los archivos grandes podrán ejecutarse en segundo plano."], ["5", "Descarga CSV", "Exporta para Shopify, Prestashop, WooCommerce o CSV genérico."]].map(([step, title, text]) => <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur" key={step}><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white font-black text-slate-950">{step}</div><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></div>)}</div><Card className="mt-8 border-cyan-400/20 bg-white/10 text-white"><h3 className="text-2xl font-black">Procesamiento en segundo plano</h3><p className="mt-3 text-slate-300">Cuando el lote sea grande, Rankelia lo procesará como trabajo. Podrás cerrar la página y recibirás un email cuando esté listo. El resultado aparecerá en tu apartado de descargas.</p><Button className="mt-5" onClick={loadDemoCSV}>Probar con CSV de ejemplo</Button></Card></div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><Badge variant="info">Outputs</Badge><h2 className="mt-4 max-w-3xl text-4xl font-black lg:text-5xl">Todo lo que necesita una ficha o categoría para trabajar mejor el SEO</h2></div><Button onClick={() => setShowAllFeatures(!showAllFeatures)} variant="secondary">{showAllFeatures ? "Ocultar detalle" : "Ver todo lo que genera"}</Button></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featureGroups.map((group) => <Card className="hover:-translate-y-1 hover:shadow-xl" key={group.title}><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">{group.icon}</span><Badge variant="ai">{group.badge}</Badge></div><h3 className="mt-5 text-xl font-black">{group.title}</h3><ul className="mt-4 space-y-2 text-sm text-slate-600">{group.items.map((item) => <li key={item}>✓ {item}</li>)}</ul></Card>)}</div>
          {showAllFeatures && <div className="mt-6 flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-5">{allFeatures.map((feature) => <Badge key={feature}>{feature}</Badge>)}</div>}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge variant="info">Plataformas</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Exporta en el formato que tu ecommerce necesita</h2><p className="mt-4 max-w-2xl text-lg text-slate-600">Empieza con CSV limpio y conecta después con tu flujo de importación.</p><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{platformCards.map((platform) => <Card key={platform.name}><Badge variant="success">CSV listo</Badge><h3 className="mt-4 text-2xl font-black">{platform.name}</h3><p className="mt-2 text-sm text-slate-600">{platform.text}</p><p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">{platform.fields}</p><div className="mt-5 flex gap-2"><Button onClick={() => openPlatformModal(platform.name)} variant="secondary">Ver formato</Button><Button onClick={() => downloadPlatformExample(platform.name)} variant="ghost">Descargar</Button></div></Card>)}</div>
        </section>

        <section id="ahorro" className="dark-radial text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><Badge variant="ai">ROI calculator</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Calcula cuánto tiempo y dinero puedes ahorrar</h2><p className="mt-4 max-w-2xl text-lg text-slate-300">Selecciona cuántos productos necesitas optimizar al mes.</p><Card className="mt-8 border-white/10 bg-white/10 text-white backdrop-blur"><label className="text-sm font-bold" htmlFor="savings-slider">Productos seleccionados: {formatNumber(products)}</label><input className="mt-4 w-full accent-cyan-400" id="savings-slider" list="product-marks" max={10000} min={50} onChange={(event) => setProducts(Number(event.target.value))} step={50} type="range" value={products} /><datalist id="product-marks">{[50, 100, 500, 1000, 2500, 5000, 10000].map((value) => <option key={value} value={value} />)}</datalist><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Horas manuales", `${savings.manualHours} h`], ["Horas con Rankelia", `${savings.rankeliaHours} h`], ["Horas ahorradas", `${savings.savedHours} h`], ["Ahorro estimado", formatCurrency(savings.saving)], ["Coste manual", formatCurrency(savings.manualCost)], ["Coste Rankelia", `${formatCurrency(savings.rankeliaCost)} aprox.`], ["Productos estándar", formatNumber(Math.ceil(savings.credits / PRODUCT_STANDARD_CREDITS))], ["Pack recomendado", `${formatNumber(savings.recommendedPack.products ?? Math.ceil(savings.recommendedPack.credits / PRODUCT_STANDARD_CREDITS))} productos`]].map(([label, value]) => <div className="rounded-2xl border border-white/10 bg-white/10 p-5" key={label}><p className="text-sm text-slate-300">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div><div className="mt-8 grid gap-4 lg:grid-cols-2"><div><div className="mb-2 flex justify-between text-sm font-bold"><span>Trabajo manual</span><span>{formatCurrency(savings.manualCost)}</span></div><ProgressBar value={100} status="danger" /></div><div><div className="mb-2 flex justify-between text-sm font-bold"><span>Rankelia</span><span>{formatCurrency(savings.rankeliaCost)}</span></div><ProgressBar value={Math.max(4, 100 - savings.percentage)} status="success" /></div></div><Button className="mt-8" onClick={() => scrollToSection("hero-uploader")}>Analizar mi CSV gratis</Button></Card></div>
        </section>

        <section id="creditos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Badge variant="info">Productos extra</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Compra productos SEO extra cuando tu catálogo crece</h2><p className="mt-4 max-w-2xl text-lg text-slate-600">Tú eliges productos; Rankelia mantiene créditos internos solo para cálculo técnico.</p><Card className="mt-8" variant="gradient"><label className="font-bold" htmlFor="credits-slider">Pack seleccionado: {formatNumber(selectedPack.products)} productos SEO extra</label><input className="mt-4 w-full accent-blue-600" id="credits-slider" max={creditPacks.length - 1} min={0} onChange={(event) => setCreditIndex(Number(event.target.value))} step={1} type="range" value={creditIndex} /><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5"><div className="xl:col-span-2"><p className="text-5xl font-black">{formatCurrency(selectedPack.price)}</p><p className="mt-2 text-slate-600">{selectedPack.ideal} · {formatPricePerProduct({ price: selectedPack.price, quantity: selectedPack.products })}</p><Button className="mt-6" href="/login?mode=register&intent=extra_products&pack=products_1000">Comprar productos extra</Button></div>{[["Estándar", selectedPack.products], ["Pro", Math.floor(selectedPack.products / 2)], ["Premium", Math.floor(selectedPack.products / 4)]].map(([label, value]) => <div className="rounded-2xl bg-white p-5" key={label.toString()}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">~{formatNumber(Number(value))}</p></div>)}</div></Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="max-w-4xl text-4xl font-black lg:text-5xl">ChatGPT te da texto. Rankelia te devuelve un CSV SEO listo para importar.</h2><p className="mt-4 max-w-2xl text-lg text-slate-600">La diferencia no es solo generar contenido: es organizarlo, escalarlo y exportarlo.</p><div className="mt-8 grid gap-6 lg:grid-cols-2"><Card className="border-amber-200 bg-amber-50/50"><h3 className="text-2xl font-black">Manual / ChatGPT</h3>{["Copiar producto por producto", "Sin formato de importación", "Sin score por fila", "Sin control de duplicados", "Difícil mantener consistencia", "No genera categorías SEO completas", "No detecta campos vacíos del catálogo"].map((item) => <p className="mt-3 rounded-2xl bg-white p-3 text-slate-700" key={item}>⚠ {item}</p>)}</Card><Card className="border-emerald-200 bg-emerald-50/60"><h3 className="text-2xl font-black">Rankelia</h3>{["Procesamiento por CSV", "Export Shopify/Prestashop/WooCommerce", "Score SEO por fila", "ALT text IA revisable", "Avisos anti-repetición", "Preview gratuita", "Categorías + productos", "Diagnóstico antes de login"].map((item) => <p className="mt-3 rounded-2xl bg-white p-3 text-slate-700" key={item}>✓ {item}</p>)}</Card></div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge variant="ai">Casos de uso</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Pensado para ecommerce reales, agencias y catálogos grandes</h2><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{useCases.map(([title, problem, generates, result]) => <Card className="hover:-translate-y-1 hover:shadow-xl" key={title}><h3 className="text-lg font-black">{title}</h3><p className="mt-4 text-sm"><b>Problema:</b> {problem}</p><p className="mt-3 text-sm"><b>Genera:</b> {generates}</p><p className="mt-3 text-sm text-emerald-700"><b>Resultado:</b> {result}</p></Card>)}</div>
        </section>

        <section id="precios" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center"><Badge variant="ai">Pricing público</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Planes por productos SEO, sin hablar en tokens</h2><p className="mt-4 text-slate-600">Cada producto puede incluir metas, slug, descripción HTML, FAQs, schema, ALT text revisable, warnings y export CSV.</p></div><h3 className="mt-12 text-2xl font-black">Productos extra</h3><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{creditPacks.map((pack) => <Card key={pack.credits}><h4 className="text-xl font-black">{formatNumber(pack.products)} productos extra</h4><p className="mt-2 text-3xl font-black">{formatCurrency(pack.price)}</p><p className="mt-3 text-sm text-slate-600">{formatPricePerProduct({ price: pack.price, quantity: pack.products })} · estándar, Pro o Premium según profundidad.</p><p className="mt-3 text-sm font-semibold text-slate-500">Ideal para: {pack.ideal}</p><Button className="mt-5 w-full" href="/login?mode=register&intent=extra_products&pack=products_1000" variant="secondary">Comprar productos</Button></Card>)}</div><h3 className="mt-12 text-2xl font-black">Planes mensuales</h3><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{monthlyPlans.map((plan) => <Card className={plan.featured ? "ring-2 ring-blue-500" : ""} key={plan.name} variant={plan.featured ? "gradient" : "default"}>{plan.featured && <Badge variant="ai">Recomendado</Badge>}<h4 className="mt-3 text-2xl font-black">{plan.name}</h4><p className="mt-3 text-4xl font-black">{plan.price}</p><p className="mt-2 font-semibold text-blue-700">{plan.products}</p><p className="mt-1 text-sm text-slate-500">{plan.equivalent}</p><ul className="mt-5 space-y-2 text-sm text-slate-600">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><Button className="mt-6 w-full" href={`/login?mode=register&intent=plan&plan=${plan.id}`} variant={plan.featured ? "primary" : "secondary"}>{plan.cta}</Button></Card>)}</div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge variant="info">Beta</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Ejemplos de uso representativos de la beta</h2><p className="mt-4 max-w-2xl text-lg text-slate-600">Casos típicos donde Rankelia ahorra trabajo operativo y mejora la base SEO del catálogo.</p><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{representativeCases.map(([initials, role, quote, badge]) => <Card key={role}><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 font-black text-white">{initials}</div><div><Badge variant="warning">Caso representativo</Badge><p className="mt-1 font-bold">{role}</p></div></div><p className="mt-5 text-slate-700">“{quote}”</p><p className="mt-4 text-sm font-bold text-amber-500">★★★★★ · {badge}</p></Card>)}</div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center"><Badge variant="info">FAQ</Badge><h2 className="mt-4 text-4xl font-black lg:text-5xl">Preguntas frecuentes</h2><p className="mt-4 text-slate-600">Rankelia genera una base SEO avanzada, pero el contenido debe revisarse antes de publicar.</p></div><div className="mt-8 space-y-3">{faqItems.map(([question, answer], index) => <div className="rounded-3xl border border-slate-200 bg-white shadow-sm" key={question}><button aria-expanded={openFaq === index} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold" onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><span>{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <p className="px-5 pb-5 text-sm leading-6 text-slate-600">{answer}</p>}</div>)}</div>
        </section>

        <section className="dark-radial px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center"><Badge variant="ai">Empieza con valor antes de registrarte</Badge><h2 className="mt-5 text-4xl font-black lg:text-6xl">Convierte tu catálogo en una base SEO lista para revisar</h2><p className="mx-auto mt-5 max-w-3xl text-lg text-slate-300">Empieza con un diagnóstico gratuito. Sube tu CSV y descubre cuántas oportunidades tienes antes de crear cuenta.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => scrollToSection("hero-uploader")}>Analizar mi CSV gratis</Button><Button onClick={loadDemoCSV} variant="secondary">Usar CSV de ejemplo</Button><Button href="/login?mode=register" variant="secondary">Registrarme</Button></div></div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:px-8"><div><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 font-black text-white">R</span><p className="font-black">Rankelia.ai</p></div><p className="mt-4 max-w-md text-sm leading-6 text-slate-600">CSV-first ecommerce SEO para convertir productos y categorías pobres en contenido SEO revisable y exportable.</p></div><div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-600">{[["Producto", "hero"], ["Cómo funciona", "como-funciona"], ["Precios", "precios"], ["FAQ", "faq"]].map(([link, target]) => <button className="text-left hover:text-slate-950" key={link} onClick={() => scrollToSection(target)}>{link}</button>)}{[["Contacto", "/support"], ["Privacidad", "/privacy"], ["Términos", "/terms"], ["Cookies", "/cookies"]].map(([link, href]) => <a className="text-left hover:text-slate-950" href={href} key={href}>{link}</a>)}</div><div className="flex flex-wrap content-start gap-2">{["CSV-first", "Ecommerce SEO", "Shopify", "Prestashop", "WooCommerce"].map((badge) => <Badge key={badge}>{badge}</Badge>)}</div></div><div className="border-t border-slate-200 px-4 py-5 text-center text-sm text-slate-500">© 2026 Rankelia.ai · No publicamos automáticamente · Revisas antes de importar · Exportamos CSV</div>
      </footer>

      <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden"><Button className="w-full" onClick={() => scrollToSection("hero-uploader")}>Analizar CSV gratis</Button></div>

      {toast && <div className={`fixed right-4 top-20 z-[60] max-w-sm rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-2xl ${toast.type === "success" ? "border-emerald-200 text-emerald-700" : toast.type === "warning" ? "border-amber-200 text-amber-700" : "border-blue-200 text-blue-700"}`}>{toast.message}</div>}

      {modal && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true"><Card className="max-h-[90vh] w-full max-w-2xl overflow-auto" variant="elevated"><Badge variant="success">Formato {modal.platform}</Badge><h2 className="mt-4 text-2xl font-black">Ejemplo de columnas para {modal.platform}</h2><pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{platformExamples[modal.platform]}</pre><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button onClick={() => downloadPlatformExample(modal.platform)}>Descargar ejemplo CSV</Button><Button onClick={() => setModal(null)} variant="secondary">Cerrar</Button></div></Card></div>}

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </div>
  );
}
