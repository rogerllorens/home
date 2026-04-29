'use client'
import { useState } from 'react'
export function PhotoUploader(){const [msg,setMsg]=useState('');const onChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>5*1024*1024)return setMsg('Máx 5MB');if(!f.type.startsWith('image/'))return setMsg('Solo imágenes');const fd=new FormData();fd.append('file',f);const r=await fetch('/api/profile/view',{method:'POST',body:fd});setMsg(r.ok?'Foto subida':'Error al subir')};return <div className='card'><input type='file' onChange={onChange}/><p className='text-sm mt-2'>{msg}</p></div>}
