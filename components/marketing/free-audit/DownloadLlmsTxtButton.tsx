"use client";
import { Button } from "@/components/ui/Button";
export function DownloadLlmsTxtButton({ content }: { content: string }) {
  function download() { const blob = new Blob([content], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "llms.txt"; a.click(); URL.revokeObjectURL(url); }
  async function copy() { await navigator.clipboard?.writeText(content); }
  return <div className="flex flex-col gap-2 sm:flex-row"><Button onClick={download}>Descargar llms.txt</Button><Button onClick={copy} variant="secondary">Copiar contenido</Button></div>;
}
