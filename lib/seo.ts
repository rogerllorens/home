import type { Metadata } from 'next'
export const baseMeta:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:'Currículum del Amor',description:'Crea tu CV amoroso y compártelo.',openGraph:{title:'Currículum del Amor',description:'Crea tu CV amoroso y compártelo.'},twitter:{card:'summary_large_image'}}
export const profileMeta=(name:string):Metadata=>({title:`Currículum del Amor de ${name}`,description:'Disponible para entrevista sentimental. Descubre su CV amoroso.'})
