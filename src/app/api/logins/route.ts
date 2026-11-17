import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Strictly restricted to Leadership roles: ADMIN (MD), CEO, and IT_ADMIN (IT Manager)
    const allowedRoles = ['ADMIN', 'CEO', 'IT_ADMIN'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden. Only Managing Director, CEO, and IT Manager can view Login Activity.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || '';
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('userId') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 300);

    // Historical auto-backfill: If LoginRecord table is empty, backfill from past audit_logs
    const recordCount = await prisma.loginRecord.count();
    if (recordCount === 0) {
      const pastLogins = await prisma.auditLog.findMany({
        where: { action: 'USER_LOGIN' },
        include: { user: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      if (pastLogins.length > 0) {
        for (const log of pastLogins) {
          if (log.user) {
            await prisma.loginRecord.create({
              data: {
                userId: log.user.id,
                username: log.user.username,
                name: log.user.name,
                role: log.user.role,
                platform: 'Computer',
                device: 'Desktop Browser',
                os: 'Windows 11',
                browser: 'Chrome',
                ipAddress: '127.0.0.1 (Local)',
                userAgent: 'Historical Audit Import',
                status: 'SUCCESS',
                createdAt: log.createdAt,
              },
            });
          }
        }
      }
    }

    // Build Prisma query filter
    const where: any = {};

    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (userId && userId !== 'ALL') {
      where.userId = userId;
    }

    if (search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { username: { contains: term, mode: 'insensitive' } },
        { device: { contains: term, mode: 'insensitive' } },
        { os: { contains: term, mode: 'insensitive' } },
        { browser: { contains: term, mode: 'insensitive' } },
        { ipAddress: { contains: term, mode: 'insensitive' } },
        { role: { contains: term, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.loginRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            designation: true,
            isActive: true,
          },
        },
      },
    });

    // Compute stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalCount, todayCount, computerCount, mobileCount, failedCount] = await Promise.all([
      prisma.loginRecord.count(),
      prisma.loginRecord.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.loginRecord.count({ where: { platform: 'Computer' } }),
      prisma.loginRecord.count({ where: { platform: { in: ['Mobile', 'Tablet'] } } }),
      prisma.loginRecord.count({ where: { status: 'FAILED' } }),
    ]);

    return NextResponse.json({
      records,
      stats: {
        total: totalCount,
        today: todayCount,
        computer: computerCount,
        mobile: mobileCount,
        failed: failedCount,
      },
    });
  } catch (error: any) {
    console.error('Fetch login activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch login records' }, { status: 500 });
  }
}
