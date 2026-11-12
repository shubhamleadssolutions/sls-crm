import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { assignedProspects: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only ADMIN or CEO can create users
    if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'CEO') {
      return NextResponse.json({ error: 'Permission denied: Only Admin or CEO can create users' }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, email, password, role, designation, phone } = body;

    if (!name?.trim() || !username?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Name, Username, Email, and Password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate username or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail },
        ],
      },
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        return NextResponse.json({ error: `Username "${cleanUsername}" is already taken` }, { status: 400 });
      }
      return NextResponse.json({ error: `Email "${cleanEmail}" is already registered` }, { status: 400 });
    }

    const passwordHash = await hashPassword(password.trim());

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: role || 'BD_INTERN',
        designation: designation?.trim() || (role === 'ADMIN' ? 'Administrator' : 'Team Member'),
        phone: phone?.trim() || null,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newUser.id,
        details: `${sessionUser.name} created user "${newUser.name}" (@${newUser.username}) with role ${newUser.role}`,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
