'use client'
const t=['Clásico romántico','Minimal premium','Dark drama','LinkedIn del amor','Pop viral']
export function TemplateSelector({value,onChange}:{value:string;onChange:(v:string)=>void}){return <div className='grid grid-cols-2 gap-2'>{t.map(x=><button type='button' key={x} onClick={()=>onChange(x)} className={`card text-left ${value===x?'ring-2 ring-coral':''}`}>{x}</button>)}</div>}
