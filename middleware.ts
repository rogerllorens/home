import { NextResponse, type NextRequest } from 'next/server'
const PRIVATE=['/dashboard']
export function middleware(req:NextRequest){const p=req.nextUrl.pathname;const needs=PRIVATE.some(x=>p.startsWith(x));const has=req.cookies.get('sb-access-token')||req.cookies.get('sb:token');if(needs&&!has){const url=req.nextUrl.clone();url.pathname='/login';return NextResponse.redirect(url)}return NextResponse.next()}
export const config={matcher:['/dashboard/:path*']}
