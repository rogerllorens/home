import Link from 'next/link'
import { FavoriteButton } from './FavoriteButton'
import { ProfileBadges } from './ProfileBadges'
import { InterviewRequestButton } from '@/components/inbox/InterviewRequestButton'
export function ExploreProfileCard({p}:{p:any}){return <article className='card space-y-2'><img src={p.avatar_url||'https://placehold.co/600x400/png'} alt={p.display_name} className='rounded-xl w-full h-44 object-cover'/><ProfileBadges featured={!!p.featured_until} newbie={new Date(p.created_at).getTime()>Date.now()-14*86400000}/><h3 className='text-lg font-semibold'>{p.display_name}</h3><p className='text-sm'>{p.city}</p><p className='text-sm line-clamp-2'>{p.bio_short}</p><div className='flex gap-2 flex-wrap'><FavoriteButton profileId={p.id}/><Link href={`/u/${p.username}`} className='btn-secondary'>Ver CV completo</Link></div><InterviewRequestButton receiverProfileId={p.id}/></article>}
