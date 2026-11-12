import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const cleanUsername = (username || '').trim();

    if (!cleanUsername || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user strictly by username (email login disabled per policy)
    const user = await prisma.user.findFirst({
      where: {
        username: { equals: cleanUsername, mode: 'insensitive' },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: `${user.name} (${user.username}) logged in`,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
      },
    });

    response.cookies.set('sls_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
