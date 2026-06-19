import { RealJobDetailPage } from "@/components/app/real/RealJobDetailPage";
export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RealJobDetailPage jobId={id} />; }
