import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createSessionToken } from '@/lib/auth';
import { detectDeviceInfo } from '@/lib/deviceDetector';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const deviceInfo = detectDeviceInfo(req);

    const rawUsername = (username || '').trim();
    const cleanUsername = rawUsername.toLowerCase();

    if (!cleanUsername || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user strictly by username (100% case-insensitive lookup)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { username: rawUsername },
          { username: { equals: cleanUsername, mode: 'insensitive' } },
          { username: { equals: rawUsername, mode: 'insensitive' } },
          { email: `${cleanUsername}@sls.internal` },
          { email: { equals: `${cleanUsername}@sls.internal`, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      // Record failed attempt for security audit
      try {
        await prisma.loginRecord.create({
          data: {
            username: cleanUsername,
            name: 'Unknown User',
            role: 'GUEST',
            platform: deviceInfo.platform,
            device: deviceInfo.device,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            status: 'FAILED',
            failureReason: 'Username not found',
          },
        });
      } catch (logErr) {
        console.error('Failed to log failed login:', logErr);
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (!user.isActive) {
      try {
        await prisma.loginRecord.create({
          data: {
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            platform: deviceInfo.platform,
            device: deviceInfo.device,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            status: 'FAILED',
            failureReason: 'Account deactivated by Administrator',
          },
        });
      } catch (logErr) {
        console.error('Failed to log deactivated user attempt:', logErr);
      }
      return NextResponse.json({ error: 'Account is deactivated. Contact Administrator.' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      try {
        await prisma.loginRecord.create({
          data: {
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            platform: deviceInfo.platform,
            device: deviceInfo.device,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            status: 'FAILED',
            failureReason: 'Incorrect password entered',
          },
        });
      } catch (logErr) {
        console.error('Failed to log wrong password attempt:', logErr);
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Record successful login record with platform, device, OS, browser, IP
    try {
      await prisma.loginRecord.create({
        data: {
          userId: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          platform: deviceInfo.platform,
          device: deviceInfo.device,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
          status: 'SUCCESS',
        },
      });
    } catch (recordErr) {
      console.error('Failed to save login record:', recordErr);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: `${user.name} (${user.username}) logged in from ${deviceInfo.platform} (${deviceInfo.device}, ${deviceInfo.browser})`,
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
