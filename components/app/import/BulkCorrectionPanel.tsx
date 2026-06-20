"use client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export type EditableImportRow = Record<string, string>;
export function trimAllRows(rows: EditableImportRow[]) { return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "").trim().replace(/\s+/g, " ")]))) as EditableImportRow[]; }
export function removeEmptyRows(rows: EditableImportRow[]) { return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim())); }
export function removeRowsWithoutColumn(rows: EditableImportRow[], column: string) { return rows.filter((row) => String(row[column] ?? "").trim()); }

export function BulkCorrectionPanel({ rows, requiredColumn, onRowsChange }: { rows: EditableImportRow[]; requiredColumn?: string; onRowsChange: (rows: EditableImportRow[]) => void }) {
  return <Card><h2 className="text-xl font-black">Correcciones masivas</h2><p className="mt-2 text-sm text-slate-600">Aplica cambios seguros antes de crear el job. No ejecutamos fórmulas ni macros.</p><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => onRowsChange(trimAllRows(rows))} type="button" variant="secondary">Trim y normalizar espacios</Button><Button onClick={() => onRowsChange(removeEmptyRows(rows))} type="button" variant="secondary">Eliminar filas vacías</Button>{requiredColumn ? <Button onClick={() => onRowsChange(removeRowsWithoutColumn(rows, requiredColumn))} type="button" variant="secondary">Eliminar sin {requiredColumn}</Button> : null}</div></Card>;
}
