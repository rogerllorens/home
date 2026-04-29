import { createClient } from '@/lib/supabase/server'
export async function requireUser(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user) throw new Error('UNAUTHORIZED');return {s,user}}
