import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { InboxStatusBadge } from '@/components/inbox/InboxStatusBadge'
export default async function Sent(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data}=await s.from('interview_requests').select('*').eq('sender_id',user.id).order('created_at',{ascending:false});return <main className='p-4 max-w-3xl mx-auto'><h1 className='text-2xl font-bold mb-3'>Candidaturas enviadas</h1><div className='space-y-3'>{(data||[]).map(r=><Link key={r.id} href={`/dashboard/sent/${r.id}`} className='card block'><div className='flex justify-between'><p>{r.proposal_type}</p><InboxStatusBadge status={r.status}/></div></Link>)}</div></main>}
