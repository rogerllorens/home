'use client'
export function ShareButtons({url}:{url:string}){return <div className='flex gap-2'><button className='btn-secondary' onClick={()=>navigator.clipboard.writeText(url)}>Copiar enlace</button><a className='btn-primary' href={`https://wa.me/?text=${encodeURIComponent(url)}`}>Compartir</a></div>}
