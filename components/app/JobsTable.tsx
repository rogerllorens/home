import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { Table, Td } from "@/components/ui/Table";
import { demoJobs } from "@/lib/mock-data";

export function JobsTable() {
  return <Table headers={["Job", "Plataforma", "Estado", "Progreso", "Score", "Creado"]}>{demoJobs.map((job) => <tr key={job.id}><Td><div className="font-bold text-slate-950">{job.name}</div><div className="text-xs text-slate-500">{job.id} · {job.rows} filas</div></Td><Td>{job.platform}</Td><Td><Badge variant={job.status === "Listo" ? "success" : job.status === "Error" ? "danger" : "warning"}>{job.status}</Badge></Td><Td><div className="w-36"><ProgressBar value={job.progress} status={job.status === "Error" ? "danger" : "info"} /></div></Td><Td><ScoreBadge compact score={job.score} /></Td><Td>{job.createdAt}</Td></tr>)}</Table>;
}
