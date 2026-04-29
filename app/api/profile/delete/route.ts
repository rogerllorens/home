import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(req:Request){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.redirect(new URL('/login',req.url));await s.from('profiles').delete().eq('user_id',user.id);await s.auth.signOut();return NextResponse.redirect(new URL('/',req.url));}
