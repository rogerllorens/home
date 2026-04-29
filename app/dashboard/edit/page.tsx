import { CVWizard } from '@/components/wizard/CVWizard'
import { createClient } from '@/lib/supabase/server'
export default async function Edit(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data:p}=await s.from('profiles').select('*').eq('user_id',user.id).single();const {data:c}=await s.from('love_cvs').select('*').eq('profile_id',p?.id).single();const initial={...p,...c};return <main className='p-4 max-w-6xl mx-auto'><CVWizard initial={initial as any}/></main>}
