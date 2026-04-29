import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
export async function POST(req:Request){const sig=(await headers()).get('stripe-signature')||'';const body=await req.text();let event;try{event=stripe.webhooks.constructEvent(body,sig,process.env.STRIPE_WEBHOOK_SECRET||'')}catch{return new Response('bad sig',{status:400})}
const s=await createClient();
if(event.type==='checkout.session.completed'){const o:any=event.data.object;await s.from('payments').update({status:'completed'}).eq('stripe_checkout_session_id',o.id);}
if(event.type==='customer.subscription.created'||event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){const sub:any=event.data.object;const userId=sub.metadata?.user_id||sub.client_reference_id;if(userId)await s.from('subscriptions').upsert({user_id:userId,stripe_customer_id:sub.customer,stripe_subscription_id:sub.id,plan:'pro',status:sub.status,current_period_start:new Date(sub.current_period_start*1000).toISOString(),current_period_end:new Date(sub.current_period_end*1000).toISOString(),cancel_at_period_end:sub.cancel_at_period_end},{onConflict:'user_id'})}
if(event.type==='payment_intent.succeeded'){const pi:any=event.data.object;await s.from('payments').upsert({user_id:pi.metadata?.user_id||null,stripe_payment_intent_id:pi.id,type:pi.metadata?.type||'payment',amount:pi.amount_received,currency:pi.currency,status:'succeeded',metadata:pi.metadata})}
return new Response('ok')}
