import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'CEO')) {
      return NextResponse.json({ error: 'Permission denied: Admin or CEO only' }, { status: 403 });
    }

    const body = await req.json();
    const { name, role, designation, phone, isActive, password } = body;

    // Protection: User / Admin cannot deactivate their own account
    if (sessionUser.id === params.id && isActive === false) {
      return NextResponse.json(
        { error: 'Security constraint: You cannot deactivate your own account.' },
        { status: 400 }
      );
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (role !== undefined) data.role = role;
    if (designation !== undefined) data.designation = designation.trim();
    if (phone !== undefined) data.phone = phone.trim();
    if (isActive !== undefined) data.isActive = isActive;
    if (password && password.trim()) {
      data.passwordHash = await hashPassword(password.trim());
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: updated.id,
        details: `${sessionUser.name} updated user "${updated.name}" (@${updated.username})`,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'CEO')) {
      return NextResponse.json({ error: 'Permission denied: Admin or CEO only' }, { status: 403 });
    }

    // Protection: Cannot delete your own account
    if (sessionUser.id === params.id) {
      return NextResponse.json({ error: 'Security constraint: You cannot delete your own admin account.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete / deactivate user
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: params.id,
        details: `${sessionUser.name} deactivated user "${targetUser.name}" (@${targetUser.username})`,
      },
    });

    return NextResponse.json({ success: true, message: 'User deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
