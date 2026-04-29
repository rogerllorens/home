import { createClient } from '@/lib/supabase/server'
import { CVSectionCard } from '@/components/cv/CVSectionCard'
import { ShareButtons } from '@/components/shared/ShareButtons'
import { RegisterView } from '@/components/cv/RegisterView'
import { ReportDialog } from '@/components/shared/ReportDialog'
import { profileMeta } from '@/lib/seo'
import { InterviewRequestButton } from '@/components/inbox/InterviewRequestButton'

export async function generateMetadata({params}:{params:{username:string}}){const s=await createClient();const {data:p}=await s.from('profiles').select('display_name').eq('username',params.username).single();return profileMeta(p?.display_name||'Perfil')}

export default async function Public({ params }: { params: { username: string } }) {
  const s = await createClient()
  const { data: profile } = await s.from('profiles').select('*').eq('username', params.username).eq('is_public', true).single()
  if (!profile) return <main className='p-4'>Perfil no disponible</main>
  const { data: cv } = await s.from('love_cvs').select('*').eq('profile_id', profile.id).single()
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/u/${profile.username}`
  return (
    <main className='p-4 max-w-3xl mx-auto space-y-4'>
      <RegisterView profileId={profile.id} />
      <div className='card'>
        <h1 className='text-3xl font-bold'>{profile.display_name}</h1>
        <p>{profile.city}, {profile.country}</p>
        <p className='mt-2'>{cv?.headline}</p>
      </div>
      <CVSectionCard title='Sobre mí'>{cv?.about_me}</CVSectionCard>
      <CVSectionCard title='Green flags'>{cv?.green_flags?.join(', ')}</CVSectionCard>
      <CVSectionCard title='Red flags suaves'>{cv?.soft_red_flags?.join(', ')}</CVSectionCard>
      <InterviewRequestButton receiverProfileId={profile.id}/>
      <ShareButtons url={url} />
      <ReportDialog profileId={profile.id}/>
    </main>
  )
}
