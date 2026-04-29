'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema } from '@/lib/validations/profile'
import type { z } from 'zod'
type I=z.infer<typeof profileSchema>
export function CVEditorForm({initial}:{initial?:Partial<I>}){const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<I>({resolver:zodResolver(profileSchema),defaultValues:initial});const onSubmit=async(v:I)=>{await fetch('/api/profile/check-username',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(v)});location.href='/dashboard'};const fields=['username','display_name','city','country','intention','emotional_status','headline','applying_for','about_me','affective_skills','green_flags','soft_red_flags','love_languages','ideal_date','availability','final_cta'] as const;return <form onSubmit={handleSubmit(onSubmit)} className='card space-y-3'>{fields.map(f=><div key={f}><input className='w-full rounded-xl border p-3' placeholder={f} {...register(f as keyof I)} />{errors[f]&&<p className='text-xs text-red-500'>Campo inválido</p>}</div>)}<button disabled={isSubmitting} className='btn-primary'>{isSubmitting?'Guardando...':'Guardar CV'}</button></form>}
