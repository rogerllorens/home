import { Button } from "@/components/ui/Button";
import { Table, Td } from "@/components/ui/Table";
import { demoDownloads } from "@/lib/mock-data";

export function DownloadsTable() {
  return <Table headers={["Archivo", "Plataforma", "Filas", "Tamaño", "Listo", "Acción"]}>{demoDownloads.map((download) => <tr key={download.id}><Td><span className="font-bold text-slate-950">{download.fileName}</span></Td><Td>{download.platform}</Td><Td>{download.rows}</Td><Td>{download.size}</Td><Td>{download.readyAt}</Td><Td><Button variant="secondary">Descargar</Button></Td></tr>)}</Table>;
}
