'use client'
import { Copy, Share2 } from 'lucide-react'
export function StoryShareActions({url}:{url:string}){const share=async()=>{if(navigator.share){await navigator.share({title:'Currículum del Amor',url});}else{await navigator.clipboard.writeText(url)}};return <div className='flex gap-2'><button className='btn-secondary' onClick={()=>navigator.clipboard.writeText(url)}><Copy size={16}/> Copiar link</button><button className='btn-secondary' onClick={share}><Share2 size={16}/> Compartir</button></div>}
