import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/server/session';

const ADMIN_LOGIN_REDIRECT = '/auth/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;
  if (!token) {
    const loginUrl = new URL(ADMIN_LOGIN_REDIRECT, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyAccessToken(token);
    if (payload.scope !== 'admin') {
      const loginUrl = new URL(ADMIN_LOGIN_REDIRECT, request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    const loginUrl = new URL(ADMIN_LOGIN_REDIRECT, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
