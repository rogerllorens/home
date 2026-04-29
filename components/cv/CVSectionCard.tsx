import { ReactNode } from 'react'
export function CVSectionCard({title,children}:{title:string;children:ReactNode}){return <div className='card'><h3 className='font-semibold mb-2'>{title}</h3><div className='text-sm text-gray-700 whitespace-pre-wrap'>{children}</div></div>}
