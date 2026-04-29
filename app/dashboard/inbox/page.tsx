import { createClient } from '@/lib/supabase/server'
import { InboxList } from '@/components/inbox/InboxList'
export default async function Inbox(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data}=await s.from('interview_requests').select('*').eq('receiver_id',user.id).order('created_at',{ascending:false});return <main className='p-4 max-w-3xl mx-auto'><h1 className='text-2xl font-bold mb-3'>Buzón de Currículums</h1><InboxList items={data||[]}/></main>}
