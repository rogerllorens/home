import { InboxCard } from './InboxCard'
export function InboxList({items}:{items:any[]}){if(!items.length)return <div className='card'>Alguien quiere postularse para entrar en tu vida. Aún no hay candidaturas.</div>;return <div className='space-y-3'>{items.map(i=><InboxCard key={i.id} r={i}/>)}</div>}
