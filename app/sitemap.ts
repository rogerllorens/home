import type { MetadataRoute } from 'next'
export default function sitemap():MetadataRoute.Sitemap{const b=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';return ['','/login','/privacy','/terms','/safety'].map(p=>({url:`${b}${p}`,lastModified:new Date()}))}
