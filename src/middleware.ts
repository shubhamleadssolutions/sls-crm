import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sls_token')?.value;
  const { pathname } = request.nextUrl;

  // Static files and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ttf')
  ) {
    return NextResponse.next();
  }

  // If visiting /login:
  // If the user already has an active, unexpired token, redirect to /
  if (pathname === '/login') {
    if (token) {
      const payload = parseJwtPayload(token);
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // If not logged in and not on /login, redirect to /login
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-Based Route Access Control (Fast Edge Filtering)
  const payload = parseJwtPayload(token);
  const role = payload?.role;

  // 1. Invoices & Billing: CEO and MD (ADMIN) only
  if (pathname.startsWith('/billing')) {
    if (role && role !== 'ADMIN' && role !== 'CEO') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Business Reports: CEO and MD (ADMIN) only
  if (pathname.startsWith('/reports')) {
    if (role && role !== 'ADMIN' && role !== 'CEO') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. User Management: CEO, MD (ADMIN), and IT Manager (IT_ADMIN) only
  if (pathname.startsWith('/settings/users')) {
    if (role && role !== 'ADMIN' && role !== 'CEO' && role !== 'IT_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
