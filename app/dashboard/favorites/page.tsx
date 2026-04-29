import { createClient } from '@/lib/supabase/server'
import { FavoriteProfilesGrid } from '@/components/explore/FavoriteProfilesGrid'
export default async function Favorites(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data}=await s.from('favorites').select('id,profiles!favorites_profile_id_fkey(display_name,username)').eq('user_id',user.id).order('created_at',{ascending:false});return <main className='p-4 max-w-5xl mx-auto'><h1 className='text-2xl font-bold mb-3'>Perfiles guardados</h1><FavoriteProfilesGrid items={data||[]}/></main>}
