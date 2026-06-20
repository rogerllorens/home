"use client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { WorkbookSheetSummary } from "@/lib/import/spreadsheet-importer";

export function SpreadsheetSheetSelector({ sheets, selectedSheetId, onSelect }: { sheets: WorkbookSheetSummary[]; selectedSheetId?: string | null; onSelect: (sheetId: string) => void }) {
  if (!sheets.length) return null;
  const suggested = sheets.find((sheet) => sheet.rows > 1 && sheet.columns > 1) ?? sheets[0];
  return <Card><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="text-xl font-black">Hojas detectadas</h2><p className="text-sm text-slate-600">Hemos detectado {sheets.length} hojas. Elige cuál contiene tus productos.</p></div><Badge variant="info">Sugerida: {suggested.name}</Badge></div><div className="mt-4 grid gap-3 md:grid-cols-3">{sheets.map((sheet) => <button className={`rounded-2xl border p-4 text-left transition ${selectedSheetId === sheet.sheetId ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"}`} key={sheet.sheetId} onClick={() => onSelect(sheet.sheetId)} type="button"><div className="flex items-center justify-between gap-2"><b>{sheet.name}</b>{sheet.rows <= 1 || sheet.columns <= 1 ? <Badge variant="warning">Revisar</Badge> : <Badge variant="success">Datos</Badge>}</div><p className="mt-2 text-sm text-slate-500">{sheet.rows} filas · {sheet.columns} columnas</p></button>)}</div><Button className="mt-4" onClick={() => onSelect(selectedSheetId ?? suggested.sheetId)} type="button">Usar hoja seleccionada</Button></Card>;
}
