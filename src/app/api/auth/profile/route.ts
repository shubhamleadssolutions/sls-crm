import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword, comparePassword } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedProspects: true,
            activities: true,
            notes: true,
            meetings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Won prospects count
    const wonCount = await prisma.prospect.count({
      where: {
        assignedUserId: user.id,
        status: 'WON',
      },
    });

    return NextResponse.json({
      user,
      stats: {
        totalAssigned: user._count.assignedProspects,
        wonCount,
        activitiesCount: user._count.activities,
        meetingsCount: user._count.meetings,
      },
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, designation, phone, currentPassword, newPassword } = body;

    const dataToUpdate: any = {};

    if (name && typeof name === 'string' && name.trim()) {
      dataToUpdate.name = name.trim();
    }

    if (designation !== undefined) {
      dataToUpdate.designation = designation.trim();
    }

    if (phone !== undefined) {
      dataToUpdate.phone = phone.trim();
    }

    // Password change
    if (newPassword && typeof newPassword === 'string' && newPassword.trim()) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }

      const fullUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { passwordHash: true },
      });

      if (!fullUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isMatch = await comparePassword(currentPassword, fullUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password does not match' }, { status: 400 });
      }

      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }

      dataToUpdate.passwordHash = await hashPassword(newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'PROFILE_UPDATED',
        entityType: 'User',
        entityId: updatedUser.id,
        details: `${updatedUser.name} (@${updatedUser.username}) updated their profile details`,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
