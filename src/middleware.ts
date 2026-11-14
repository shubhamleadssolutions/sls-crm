import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sls_crm_super_secret_jwt_key_2026_shubham_leads'
);

export async function middleware(request: NextRequest) {
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

  // If already logged in and visiting /login, redirect to /
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If not logged in and not on /login or /api/auth routes, redirect to /login
  if (!token && pathname !== '/login') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-Based Route Access Control
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      const role = (payload as any)?.role;

      // 1. Invoices & Billing: CEO and MD (ADMIN) only
      if (pathname.startsWith('/billing')) {
        if (role !== 'ADMIN' && role !== 'CEO') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // 2. Business Reports: CEO and MD (ADMIN) only
      if (pathname.startsWith('/reports')) {
        if (role !== 'ADMIN' && role !== 'CEO') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // 3. User Management: CEO, MD (ADMIN), and IT Manager (IT_ADMIN) only
      if (pathname.startsWith('/settings/users')) {
        if (role !== 'ADMIN' && role !== 'CEO' && role !== 'IT_ADMIN') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch {
      // Invalid or expired token
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
