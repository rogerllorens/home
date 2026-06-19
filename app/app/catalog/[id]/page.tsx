import { RealCatalogDetailPage } from "@/components/app/real/RealCatalogDetailPage";
export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RealCatalogDetailPage catalogItemId={id} />; }
