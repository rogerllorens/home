import { createClient } from '@/lib/supabase/server'
export async function isProUser(userId:string){const s=await createClient();const {data}=await s.from('subscriptions').select('plan,status,current_period_end').eq('user_id',userId).single();return !!data&&data.plan==='pro'&&data.status==='active'&&(new Date(data.current_period_end)>new Date())}
export async function canExportWithoutWatermark(userId:string){return isProUser(userId)}
export async function canUsePremiumTemplate(userId:string){return isProUser(userId)}
export async function canViewProfileVisitors(userId:string){return isProUser(userId)}
export async function canViewFavoriteUsers(userId:string){return isProUser(userId)}
export async function canUseAdvancedFilters(userId:string){return isProUser(userId)}
export async function canSendInterviewRequest(userId:string){const pro=await isProUser(userId);if(pro) return true;const s=await createClient();const {count}=await s.from('interview_requests').select('*',{count:'exact',head:true}).eq('sender_id',userId).gte('created_at',new Date(Date.now()-86400000).toISOString());return (count||0)<5}
export async function hasActiveBoost(profileId:string){const s=await createClient();const {data}=await s.from('boosts').select('id').eq('profile_id',profileId).eq('status','active').gte('ends_at',new Date().toISOString()).limit(1);return !!data?.length}
