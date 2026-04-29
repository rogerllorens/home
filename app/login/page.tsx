'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
export default function Login(){const [email,setEmail]=useState('');const [msg,setMsg]=useState('');const submit=async()=>{const s=createClient();const {error}=await s.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/dashboard'}});setMsg(error?.message??'Revisa tu email')};return <main className='p-4 max-w-md mx-auto'><div className='card space-y-3'><h1 className='text-2xl font-bold'>Login / Registro</h1><input className='w-full border rounded-xl p-3' value={email} onChange={e=>setEmail(e.target.value)} placeholder='Email'/><button onClick={submit} className='btn-primary'>Entrar</button><p>{msg}</p></div></main>}
