import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      const res = NextResponse.json({ user: null }, { status: 401 });
      res.cookies.set('sls_token', '', { path: '/', maxAge: 0 });
      return res;
    }
    return NextResponse.json({ user });
  } catch (error) {
    const res = NextResponse.json({ user: null }, { status: 500 });
    res.cookies.set('sls_token', '', { path: '/', maxAge: 0 });
    return res;
  }
}
