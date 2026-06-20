import { RealProposalDetailPage } from "@/components/app/real/RealProposalDetailPage";
export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RealProposalDetailPage proposalId={id} />; }
