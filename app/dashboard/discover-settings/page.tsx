import { createClient } from '@/lib/supabase/server'
import { DiscoverSettingsForm } from '@/components/explore/DiscoverSettingsForm'
export default async function DS(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data}=await s.from('discover_preferences').select('*').eq('user_id',user.id).single();return <main className='p-4 max-w-xl mx-auto'><h1 className='text-2xl font-bold mb-3'>Preferencias de descubrimiento</h1><DiscoverSettingsForm initial={data}/></main>}
