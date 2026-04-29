import Link from 'next/link'
import { InboxStatusBadge } from './InboxStatusBadge'
export function InboxCard({r}:{r:any}){return <Link href={`/dashboard/inbox/${r.id}`} className='card block'><div className='flex justify-between'><p className='font-semibold'>{r.proposal_type}</p><InboxStatusBadge status={r.status}/></div><p className='text-sm mt-2 line-clamp-2'>{r.message}</p></Link>}
