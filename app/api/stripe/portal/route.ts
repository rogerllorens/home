import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
export async function POST(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:'unauthorized'},{status:401});const {data:sub}=await s.from('subscriptions').select('stripe_customer_id').eq('user_id',user.id).single();if(!sub?.stripe_customer_id)return NextResponse.json({error:'missing_customer'},{status:400});const portal=await stripe.billingPortal.sessions.create({customer:sub.stripe_customer_id,return_url:`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`});return NextResponse.json({url:portal.url})}
