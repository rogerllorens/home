"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Td } from "@/components/ui/Table";
import { useAppState } from "@/components/app/AppStateProvider";
import { analyzeCSVRows, autoMapColumns, generateCSVTemplate, parseCSV, type ColumnMapping, type CsvAnalysisSummary, type CsvRow } from "@/lib/csv";
import { buildInputFilePath, sanitizeFilename, uploadInputFile } from "@/lib/storage/files";
import { calculateJobCredits, calculateProductEquivalentUsed, normalizeQualityLevel, getRecommendedPackForDeficit, getVisibleProductCountFromCredits } from "@/lib/pricing";

const maxFileSize = 10 * 1024 * 1024;
type AIPreviewRow = { index: number; provider: string; model: string; promptVersion: string; cost: number; fallbackUsed: boolean; jsonRepaired: boolean; validationErrors: string[]; unsupportedClaims: string[]; output: { seo_product_name: string; short_description: string; meta_title: string; meta_description: string; seo_score: number; conversion_score: number; quality_warnings: string } };

const fields: Array<[keyof ColumnMapping, string]> = [["sku", "SKU"], ["nombre_producto", "Nombre producto"], ["marca", "Marca"], ["categoria", "Categoría"], ["subcategoria", "Subcategoría"], ["caracteristicas", "Características"], ["descripcion_actual", "Descripción actual"], ["keyword_principal", "Keyword principal"], ["keywords_secundarias", "Keywords secundarias"], ["plataforma", "Plataforma"], ["precio", "Precio"], ["url_actual", "URL actual"], ["imagen_url", "Imagen URL"]];

function downloadTemplate() {
  const blob = new Blob([generateCSVTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rankelia-plantilla-csv-seo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function priorityVariant(priority: string): "success" | "warning" | "danger" {
  if (priority === "Alta") return "danger";
  if (priority === "Media") return "warning";
  return "success";
}

function previewValue(row: Record<string, string | string[]>, key?: string) {
  const raw = key ? row[key] : undefined;
  return Array.isArray(raw) ? raw.join("; ") : raw || "";
}

function toDbGenerationType(value: string) {
  if (/solo metadatos/i.test(value)) return "metadata_only";
  if (/categor/i.test(value) && !/producto/i.test(value)) return "categories_seo";
  if (/productos \+ categor/i.test(value)) return "products_categories";
  return "product_complete";
}

export function RealUploadPage() {
  const router = useRouter();
  const { auth, settings, setSettings, showToast } = useAppState();
  const [csvText, setCsvText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("csv-pegado-rankelia.csv");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [analysis, setAnalysis] = useState<CsvAnalysisSummary | null>(null);
  const [busy, setBusy] = useState<"idle" | "reading" | "analyzing" | "creating" | "aiPreview">("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiPreview, setAiPreview] = useState<AIPreviewRow[]>([]);

  const estimatedJobCredits = analysis ? calculateJobCredits(analysis.validRows, { generationType: settings.generationType, qualityLevel: normalizeQualityLevel(settings.quality), categories: analysis.categories }) : 0;
  const walletBalance = auth.wallet?.balance ?? 0;
  const creditDeficit = Math.max(0, estimatedJobCredits - walletBalance);
  const recommendedPack = creditDeficit ? getRecommendedPackForDeficit(creditDeficit) : null;
  const maxRowsPerJob = Number(process.env.NEXT_PUBLIC_MAX_ROWS_PER_JOB ?? 5000);
  const limitWarning = useMemo(() => rows.length > maxRowsPerJob ? `Este entorno beta procesa hasta ${maxRowsPerJob.toLocaleString("es-ES")} filas por job. Divide el CSV en varios lotes.` : null, [rows.length, maxRowsPerJob]);

  function analyzeText(text: string, name = fileName) {
    setBusy("analyzing");
    try {
      const parsed = parseCSV(text);
      if (!parsed.headers.length) throw new Error("El CSV no tiene cabeceras detectables.");
      if (!parsed.rows.length) throw new Error("El CSV no contiene filas de productos o categorías.");
      if (parsed.headers.length > 80) showToast("CSV con muchas columnas. Revisa el mapeo antes de crear job.", "warning");
      const autoMapping = autoMapColumns(parsed.headers);
      const summary = analyzeCSVRows(parsed.rows, autoMapping, settings);
      setCsvText(text);
      setFileName(name);
      setRows(parsed.rows);
      setHeaders(parsed.headers);
      setMapping(autoMapping);
      setAnalysis(summary);
      showToast(`CSV analizado: ${parsed.rows.length} filas y ${parsed.headers.length} columnas.`, "success");
      setAiPreview([]);
      if (summary.invalidRows) showToast(`${summary.invalidRows} filas inválidas detectadas.`, "warning");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No hemos podido analizar el CSV.", "error");
    } finally {
      setBusy("idle");
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setFileName(selected.name);
    if (/\.xlsx?$/.test(selected.name.toLowerCase())) {
      showToast("XLSX detectado. En esta fase solo procesamos CSV real; convierte el archivo a CSV antes de subirlo.", "warning");
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      showToast("Formato no permitido. Sube un archivo .csv.", "error");
      return;
    }
    if (selected.size > maxFileSize) {
      showToast("El CSV supera 10MB. Divide el archivo para esta fase inicial.", "error");
      return;
    }
    setBusy("reading");
    const text = await selected.text();
    analyzeText(text, selected.name);
  }

  function reAnalyzeWithMapping(nextMapping = mapping) {
    if (!rows.length) return;
    setMapping(nextMapping);
    setAnalysis(analyzeCSVRows(rows, nextMapping, settings));
    showToast("Análisis actualizado con el mapeo manual.", "success");
  }

  async function generateAIPreview() {
    if (!rows.length || !analysis) {
      showToast("Analiza un CSV antes de generar preview IA.", "warning");
      return;
    }
    setBusy("aiPreview");
    try {
      const previewRows = rows.slice(0, 5).map((row) => {
        const normalized: CsvRow = { ...row };
        for (const [key, header] of Object.entries(mapping)) if (header) normalized[key] = row[header] ?? normalized[key] ?? "";
        return normalized;
      });
      const response = await fetch("/api/ai/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: previewRows, settings: { ...settings, generation_engine: "ai", generation_type: toDbGenerationType(settings.generationType), quality_level: normalizeQualityLevel(settings.quality), column_mapping: mapping } }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo generar preview IA.");
      setAiPreview(payload.results ?? []);
      showToast(payload.provider === "template" ? "Preview generado en fallback template. Configura API IA para generación real." : "Preview IA generado y validado.", payload.provider === "template" ? "warning" : "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error generando preview IA.", "error");
    } finally {
      setBusy("idle");
    }
  }

  async function createJob() {
    if (!auth.user) {
      showToast("Tu sesión ha caducado. Vuelve a iniciar sesión.", "error");
      return;
    }
    if (!analysis || !rows.length) {
      showToast("Analiza un CSV antes de crear el job.", "warning");
      return;
    }
    if (rows.length > maxRowsPerJob) {
      showToast(`Este CSV supera el límite beta de ${maxRowsPerJob.toLocaleString("es-ES")} filas por job. Divide el archivo en lotes.`, "warning");
      return;
    }
    if (creditDeficit > 0) {
      showToast("No tienes productos suficientes. Compra productos extra antes de procesar el lote.", "warning");
      return;
    }
    setBusy("creating");
    try {
      const platform = settings.platform === "CSV genérico" ? auth.profile?.default_platform ?? "generic" : settings.platform;
      const draftJobId = crypto.randomUUID();
      const idempotencyKey = crypto.randomUUID();
      const storagePath = buildInputFilePath(auth.user.id, draftJobId, sanitizeFilename(fileName));
      const blob = file ?? new Blob([csvText], { type: "text/csv;charset=utf-8" });
      const uploaded = await uploadInputFile(blob, storagePath);
      if (uploaded.error) throw uploaded.error;
      await fetch("/api/uploads/pending", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storagePath }) }).catch(() => null);
      showToast("Archivo guardado en Storage privado. Rankelia validará créditos y filas en servidor.", "success");

      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          inputFilePath: storagePath,
          originalFilename: fileName,
          platform,
          language: settings.language,
          country: settings.country,
          tone: settings.tone,
          generationType: toDbGenerationType(settings.generationType),
          qualityLevel: normalizeQualityLevel(settings.quality),
          columnMapping: mapping,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "No se pudo crear y reservar el job.");

      showToast(`Job creado y créditos reservados en servidor (${payload.estimatedProducts ?? "?"} productos equivalentes).`, "success");
      setConfirmOpen(false);
      router.push("/app/jobs");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error al crear job real.", "error");
    } finally {
      setBusy("idle");
    }
  }

  return <div className="space-y-8"><Card variant="elevated"><div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div><Badge variant="ai">Subida real Supabase</Badge><h2 className="mt-4 text-2xl font-black">Sube o pega un CSV</h2><p className="mt-2 text-slate-600">El archivo se analiza en el navegador y puede generar preview IA server-side antes de crear un job privado.</p><input accept=".csv,text/csv" className="sr-only" id="real-upload" onChange={handleFile} type="file" /><label className="mt-6 block cursor-pointer rounded-[1.5rem] border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center transition hover:border-blue-500" htmlFor="real-upload"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl text-white">↑</span><span className="mt-4 block font-black">Arrastra tu CSV o haz clic</span><span className="text-sm text-slate-500">CSV real · XLSX próximamente · Máx. 10MB</span></label><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => analyzeText(csvText || "sku,nombre_producto,marca,categoria,caracteristicas,descripcion_actual,keyword_principal,keywords_secundarias,plataforma\nBOTA-S3-001,Bota seguridad S3 negra,WorkSafe,Calzado laboral,\"puntera reforzada; suela antideslizante; piel resistente\",\"Bota cómoda para trabajar\",bota seguridad s3,\"bota trabajo; calzado laboral\",Prestashop", "csv-demo-rankelia.csv")} variant="secondary">Usar ejemplo</Button><Button onClick={downloadTemplate} variant="secondary">Descargar plantilla</Button><Button onClick={() => { setCsvText(""); setRows([]); setHeaders([]); setAnalysis(null); }} variant="ghost">Limpiar</Button></div></div><div><label className="text-sm font-bold text-slate-700" htmlFor="real-csv-textarea">Pega aquí tu CSV</label><textarea className="mt-2 min-h-72 w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm outline-blue-500" id="real-csv-textarea" onChange={(event) => setCsvText(event.target.value)} placeholder="sku,nombre_producto,marca,categoria..." value={csvText} /><Button className="mt-4 w-full" disabled={busy !== "idle"} onClick={() => analyzeText(csvText)}>{busy === "analyzing" ? "Analizando…" : "Analizar CSV"}</Button></div></div></Card>{limitWarning && <Card className="border-amber-200 bg-amber-50"><Badge variant="warning">Límite de plan</Badge><p className="mt-3 font-semibold text-amber-800">{limitWarning}</p></Card>}{analysis ? <><section className="space-y-4"><h2 className="text-2xl font-black">Diagnóstico real del CSV</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{[["Filas", analysis.totalRows], ["Válidas", analysis.validRows], ["Inválidas", analysis.invalidRows], ["Categorías", analysis.categories], ["Desc. vacías", analysis.emptyDescriptions], ["Desc. cortas", analysis.shortDescriptions], ["Keywords faltantes", analysis.missingKeywords], ["Duplicados", analysis.possibleDuplicates], ["Créditos", analysis.estimatedCredits], ["Score actual", analysis.currentScore]].map(([label, value]) => <Card key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{Number(value).toLocaleString("es-ES")}</p></Card>)}</div><Table headers={["Fila", "Producto", "Categoría", "Descripción", "Problemas", "Prioridad"]}>{analysis.preview.map((row, index) => <tr key={index}><Td>{index + 1}</Td><Td><b>{previewValue(row, mapping.nombre_producto ?? "nombre_producto") || previewValue(row, mapping.sku ?? "sku") || "—"}</b></Td><Td>{previewValue(row, mapping.categoria ?? "categoria") || "—"}</Td><Td><span className="line-clamp-2 max-w-xs text-slate-500">{previewValue(row, mapping.descripcion_actual ?? "descripcion_actual") || "Vacía"}</span></Td><Td>{row.__issues.length ? row.__issues.join(" · ") : "OK"}</Td><Td><Badge variant={priorityVariant(row.__priority)}>{row.__priority}</Badge></Td></tr>)}</Table></section><Card><h2 className="text-2xl font-black">Mapeo de columnas</h2><p className="mt-2 text-slate-600">Ajusta campos antes de crear el job real.</p><div className="mt-5 grid gap-4 md:grid-cols-3">{fields.map(([key, label]) => <label className="text-sm font-bold" key={key}>{label}<select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2" onChange={(event) => reAnalyzeWithMapping({ ...mapping, [key]: event.target.value || undefined })} value={mapping[key] ?? ""}><option value="">Sin mapear</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>)}</div></Card><Card variant="gradient"><h2 className="text-2xl font-black">Configuración y creación de job</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[["Plataforma", "platform", ["Shopify", "Prestashop", "WooCommerce", "CSV genérico"]], ["Idioma", "language", ["Español", "Catalán", "Inglés", "Francés"]], ["País", "country", ["España", "México", "Colombia", "Francia", "Estados Unidos"]], ["Tipo", "generationType", ["Producto completo", "Solo metadatos", "Categorías SEO", "Productos + categorías"]], ["Calidad", "quality", ["Estándar", "Pro", "Premium"]], ["Tono", "tone", ["Profesional", "Técnico", "Comercial", "Natural", "Premium", "B2B industrial"]]].map(([label, key, options]) => <label className="text-sm font-bold" key={String(key)}>{label}<select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2" onChange={(event) => setSettings({ ...settings, [key as string]: event.target.value })} value={String(settings[key as keyof typeof settings])}>{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div><div className="mt-6 grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Archivo</p><p className="mt-2 font-black">{fileName}</p></Card><Card><p className="text-sm text-slate-500">Filas</p><p className="mt-2 text-3xl font-black">{analysis.totalRows}</p></Card><Card><p className="text-sm text-slate-500">Productos equivalentes</p><p className="mt-2 text-3xl font-black">{calculateProductEquivalentUsed(analysis.validRows, normalizeQualityLevel(settings.quality)).toLocaleString("es-ES")}</p><p className="mt-1 text-xs text-slate-500">{calculateJobCredits(analysis.validRows, { generationType: settings.generationType, qualityLevel: normalizeQualityLevel(settings.quality), categories: analysis.categories }).toLocaleString("es-ES")} créditos internos</p></Card><Card><p className="text-sm text-slate-500">Estado inicial</p><p className="mt-2 font-black">queued tras reserva</p></Card></div><div className="mt-6 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-slate-700"><p>Saldo disponible: {getVisibleProductCountFromCredits(walletBalance).toLocaleString("es-ES")} productos estándar · coste estimado: {getVisibleProductCountFromCredits(estimatedJobCredits).toLocaleString("es-ES")} productos.</p>{creditDeficit > 0 && recommendedPack ? <p className="mt-2 text-amber-700">Te faltan {getVisibleProductCountFromCredits(creditDeficit).toLocaleString("es-ES")} productos. Pack recomendado: {recommendedPack.quantity.toLocaleString("es-ES")} productos por {recommendedPack.price} €. <Button className="ml-2" href="/app/credits" variant="secondary">Comprar productos</Button></p> : <p className="mt-2 text-emerald-700">Saldo suficiente. El servidor reservará productos al crear el job y el worker consumirá o liberará la reserva al terminar.</p>}</div><div className="mt-6 flex flex-wrap gap-3"><Button disabled={busy !== "idle"} onClick={generateAIPreview} variant="secondary">{busy === "aiPreview" ? "Generando IA…" : "Generar preview con IA"}</Button><Button disabled={busy !== "idle" || creditDeficit > 0} onClick={() => setConfirmOpen(true)}>{busy === "creating" ? "Creando job…" : "Guardar y crear job"}</Button></div></Card>{aiPreview.length ? <Card><div className="mb-4 flex items-center justify-between gap-3"><div><Badge variant="ai">Preview IA validado</Badge><h2 className="mt-3 text-2xl font-black">Antes de procesar todo el lote</h2><p className="text-sm text-slate-500">Se limita a 3-5 filas, nunca llama IA desde el navegador y usa fallback template si no hay API key.</p></div></div><div className="grid gap-4 lg:grid-cols-2">{aiPreview.map((item) => <Card key={item.index}><div className="flex flex-wrap gap-2"><Badge variant={item.fallbackUsed ? "warning" : "ai"}>{item.fallbackUsed ? "Fallback" : "IA real"}</Badge><Badge variant="info">{item.provider} · {item.model}</Badge>{item.jsonRepaired ? <Badge variant="warning">JSON reparado</Badge> : <Badge variant="success">JSON válido</Badge>}</div><h3 className="mt-4 text-lg font-black">{item.output.seo_product_name}</h3><p className="mt-2 text-sm text-slate-600">{item.output.short_description}</p><div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs"><p><b>Meta title:</b> {item.output.meta_title}</p><p><b>Meta description:</b> {item.output.meta_description}</p></div><p className="mt-3 text-sm font-bold">SEO {item.output.seo_score}/100 · Conversión {item.output.conversion_score}/100 · Coste estimado {Number(item.cost).toFixed(5)} €</p>{item.output.quality_warnings ? <p className="mt-2 text-xs text-amber-700">{item.output.quality_warnings}</p> : null}{item.unsupportedClaims?.length ? <p className="mt-2 text-xs text-red-700">Claims: {item.unsupportedClaims.join(" · ")}</p> : null}</Card>)}</div></Card> : null}</> : <EmptyState title="Aún no hay CSV analizado" description="Sube o pega un CSV para activar análisis real, mapeo, Storage y creación de job." icon="↑" />}{confirmOpen && analysis && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true"><Card className="w-full max-w-2xl" variant="elevated"><Badge variant="ai">Confirmar job</Badge><h2 className="mt-4 text-2xl font-black">Crear job real en Supabase</h2><p className="mt-3 text-slate-600">Se guardará el CSV original en Storage privado, el servidor creará el job, insertará todas las filas permitidas y reservará productos antes del worker.</p><div className="mt-5 grid gap-3 md:grid-cols-2"><p><b>Archivo:</b> {fileName}</p><p><b>Filas:</b> {analysis.totalRows}</p><p><b>Categorías:</b> {analysis.categories}</p><p><b>Productos equivalentes:</b> {calculateProductEquivalentUsed(analysis.validRows, normalizeQualityLevel(settings.quality)).toLocaleString("es-ES")}</p><p><b>Saldo después:</b> {getVisibleProductCountFromCredits(walletBalance - estimatedJobCredits).toLocaleString("es-ES")} productos</p><p><b>Plataforma:</b> {settings.platform}</p><p><b>Generación:</b> {settings.generationType}</p></div><div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">El worker procesará este job con IA real si hay API key configurada. Si la IA falla, usará fallback template-based y registrará warnings.</div><div className="mt-6 flex justify-end gap-3"><Button onClick={() => setConfirmOpen(false)} variant="secondary">Cancelar</Button><Button disabled={busy !== "idle"} onClick={createJob}>{busy === "creating" ? "Creando…" : "Crear job"}</Button></div></Card></div>}</div>;
}
