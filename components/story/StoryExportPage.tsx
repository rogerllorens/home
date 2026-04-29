'use client'
import { useState } from 'react'
import { StoryTemplateSelector } from './StoryTemplateSelector'
import { StoryPreviewFrame } from './StoryPreviewFrame'
import { StoryDownloadButton } from './StoryDownloadButton'
import { StoryShareActions } from './StoryShareActions'
import { StoryTemplateId } from './story-types'

export function StoryExportPage({data,url,isPremium}:{data:any;url:string;isPremium:boolean}){
  const [template,setTemplate]=useState<StoryTemplateId>('romantic-minimal')
  const premiumTemplate=template==='luxury-candidate'
  const showWatermark=!(isPremium && premiumTemplate)
  const onDone=async()=>{await fetch('/api/story/export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({template_id:template,has_watermark:showWatermark,is_premium:isPremium})})}
  return <div className='space-y-4'>
    <div className='card'><h1 className='text-2xl font-bold'>Tu CV listo para stories</h1><p className='text-gray-600'>Haz que te descubran desde Instagram</p><p className='text-sm text-gray-500'>Descarga tu story y súbela a Instagram, WhatsApp o TikTok. Incluye QR para que puedan abrir tu Currículum del Amor.</p></div>
    <StoryTemplateSelector value={template} onChange={setTemplate} isPremium={isPremium}/>
    {premiumTemplate&&!isPremium&&<div className='card'>Plantilla premium. Quitar marca de agua.</div>}
    <StoryPreviewFrame data={data} template={template} showWatermark={showWatermark} url={url}/>
    <div className='flex flex-wrap gap-2'><StoryDownloadButton onDone={onDone}/><StoryShareActions url={url}/></div>
  </div>
}
