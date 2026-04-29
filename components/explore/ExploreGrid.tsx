import { ExploreProfileCard } from './ExploreProfileCard'
export function ExploreGrid({profiles}:{profiles:any[]}){if(!profiles.length)return <div className='card'>No hay candidatos con estos filtros todavía. Amplía filtros o vuelve más tarde.</div>;return <div className='grid md:grid-cols-3 gap-4'>{profiles.map(p=><ExploreProfileCard key={p.id} p={p}/>)}</div>}
