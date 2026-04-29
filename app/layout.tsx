import './globals.css'
import type { ReactNode } from 'react'
import { baseMeta } from '@/lib/seo'
export const metadata=baseMeta
export default function RootLayout({children}:{children:ReactNode}){return <html lang='es'><body>{children}</body></html>}
